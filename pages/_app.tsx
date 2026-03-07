import type { AppProps } from "next/app";

/**
 * Minimal _app for Next.js. This project uses App Router (app/).
 * Pages in pages/ are not used; this exists so _document has a valid app shell.
 */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
