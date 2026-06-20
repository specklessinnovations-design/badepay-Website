// Vercel Edge Function — TanStack Start SSR handler
// This re-exports the SSR server built by `npm run build` (dist/server/server.js).
// Vercel Edge Runtime supports the Web Fetch API, which matches the TanStack Start server handler.
export { default } from "../dist/server/server.js";

export const config = {
  runtime: "edge",
  // Match all paths — static assets are handled by vercel.json routes first
  matcher: "/(.*)",
};
