import { Html, Head, Main, NextScript } from "next/document";

/**
 * Minimal _document for Next.js build. This project uses App Router (app/);
 * _document is only used if a request hits the Pages Router. Kept to avoid
 * "Cannot find module for page: /_document" during build.
 */
export default function Document() {
  return (
    <Html lang="tl">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
