import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const VALID_CATEGORIES = [
  "plumbing",
  "electrical",
  "carpentry",
  "painting",
  "masonry",
  "general",
] as const;

function getAIClient(): { client: OpenAI; model: string; provider: string } {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
    return {
      client: new OpenAI({ apiKey }),
      model: process.env.AI_MODEL || "gpt-4o-mini",
      provider,
    };
  }

  // Default: Gemini (OpenAI-compatible endpoint)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return {
    client: new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    }),
    model: process.env.AI_MODEL || "gemini-2.0-flash",
    provider,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  let ai: { client: OpenAI; model: string; provider: string };
  try {
    ai = getAIClient();
  } catch {
    return NextResponse.json(
      { error: "AI analysis is not configured." },
      { status: 503 }
    );
  }

  let imageBase64: string;
  let userNote = "";
  try {
    const body = await request.json();
    imageBase64 = body.image;
    if (typeof body.note === "string") {
      userNote = body.note.slice(0, 200).trim();
    }
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Image data is required." },
        { status: 400 }
      );
    }
    // Basic validation: must look like a data URI or raw base64
    if (
      !imageBase64.startsWith("data:image/") &&
      !/^[A-Za-z0-9+/=]/.test(imageBase64)
    ) {
      return NextResponse.json(
        { error: "Invalid image format." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const systemPrompt = `You are a home repair assessment AI for a Filipino handyman platform called Kumpuni.
You analyze photos of household problems and return a structured JSON assessment.

Your response MUST be valid JSON with exactly these fields:
- "category": one of "plumbing", "electrical", "carpentry", "painting", "masonry", "general"
- "title": a short 5-10 word Filipino/Taglish title of the problem (e.g. "Tumutulo ang tubo sa ilalim ng lababo")
- "description": a 1-3 sentence Filipino/Taglish description of what needs to be fixed, written as if the homeowner is describing their problem
- "urgency": one of "asap", "this_week", "flexible" — your best guess at how urgent this appears
- "estimatedCost": an object with "min" and "max" (numbers in PHP pesos) representing a fair estimated price range based on standard Filipino labor rates and likely materials needed. Consider the complexity of the repair.
- "confidence": a number 0-100 representing how confident you are in your analysis

Guidelines for cost estimation (Philippine pesos):
- Simple repairs (tightening, minor patching): ₱500–₱1,500
- Medium repairs (replacing parts, moderate labor): ₱1,500–₱5,000
- Complex repairs (significant work, multiple materials): ₱5,000–₱15,000
- Major repairs (structural, full replacement): ₱15,000+

If the image doesn't appear to show a home repair issue, set category to "general", provide a best-guess description, and set confidence below 30.

Respond with ONLY the JSON object, no markdown formatting.`;

  try {
    const imageUrl = imageBase64.startsWith("data:")
              ? imageBase64
              : `data:image/jpeg;base64,${imageBase64}`;

    const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage = {
      type: "image_url",
      image_url: ai.provider === "openai"
        ? { url: imageUrl, detail: "low" }
        : { url: imageUrl },
    };

    const response = await ai.client.chat.completions.create({
      model: ai.model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: userNote
                ? `The homeowner says: "${userNote}". Analyze this photo with that context. Provide your assessment as JSON.`
                : "Analyze this photo. What home repair issue do you see? Provide your assessment as JSON.",
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "AI did not return a response." },
        { status: 502 }
      );
    }

    // Parse the JSON — strip markdown fences if present
    const cleaned = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("AI returned invalid JSON:", content);
      return NextResponse.json(
        { error: "AI response was not valid. Please try again." },
        { status: 502 }
      );
    }

    // Validate and sanitize
    if (!VALID_CATEGORIES.includes(analysis.category)) {
      analysis.category = "general";
    }
    analysis.title =
      typeof analysis.title === "string"
        ? analysis.title.slice(0, 120)
        : "Home Repair Issue";
    analysis.description =
      typeof analysis.description === "string"
        ? analysis.description.slice(0, 500)
        : "";
    if (!["asap", "this_week", "flexible"].includes(analysis.urgency)) {
      analysis.urgency = "this_week";
    }
    if (
      !analysis.estimatedCost ||
      typeof analysis.estimatedCost.min !== "number" ||
      typeof analysis.estimatedCost.max !== "number"
    ) {
      analysis.estimatedCost = { min: 1000, max: 5000 };
    }
    analysis.confidence =
      typeof analysis.confidence === "number"
        ? Math.min(100, Math.max(0, Math.round(analysis.confidence)))
        : 50;

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI API error:", message);

    const isRateLimit =
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate");

    return NextResponse.json(
      {
        error: isRateLimit
          ? "Sobrang dami ng request. Subukan ulit pagkatapos ng ilang segundo."
          : "Hindi ma-analyze ang litrato. Subukan ulit.",
        ...(process.env.NODE_ENV === "development" && { debug: message }),
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
