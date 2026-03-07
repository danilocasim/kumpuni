import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Kumpuni",
  description: "Connect with verified skilled workers for home repair in Metro Manila",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userRole: "homeowner" | "worker" | "both" | null = null;
  if (user?.id) {
    const { data: row } = await supabase
      .from("users")
      .select("user_role")
      .eq("id", user.id)
      .maybeSingle();
    userRole = (row?.user_role as "homeowner" | "worker" | "both") ?? null;
  }

  return (
    <html lang="tl" className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased min-h-screen page-bg">
        <Nav userRole={userRole} isAuthenticated={!!user} />
        <div className="mb-20 lg:mb-0">
          {children}
        </div>
      </body>
    </html>
  );
}
