import { NextRequest, NextResponse } from "next/server";
import { getPublicWorkerProfile } from "@/lib/get-public-worker-profile";

/**
 * T037/T038: Public worker profile. Returns only safe columns (no phone, no valid_id_url).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getPublicWorkerProfile(id);
    if (!data) {
      return NextResponse.json({ error: "Worker hindi mahanap." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Worker profile API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
