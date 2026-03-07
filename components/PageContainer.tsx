"use client";

/**
 * Responsive container for main content. Use on every page.
 * - Mobile (<640px): full width, 16px padding
 * - Tablet (640–1023px): max 680px, 24px padding
 * - Desktop (1024–1279px): max 800px, 32px padding
 * - Large (1280px+): max 960px, 32px padding
 * Do NOT use on header or bottom nav (they stay full-width).
 */
export function PageContainer({
  children,
  className = "",
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** If true, use wider max-width (e.g. for browse with map). Desktop: max-w-[1200px] */
  wide?: boolean;
}) {
  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${
        wide
          ? "max-w-[480px] sm:max-w-[680px] lg:max-w-[1200px]"
          : "max-w-[480px] sm:max-w-[680px] lg:max-w-[800px] xl:max-w-[960px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
