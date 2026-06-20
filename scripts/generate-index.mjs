/**
 * generate-index.mjs
 *
 * Post-build script: calls the TanStack Start SSR server handler once to produce
 * the HTML shell, then writes it to dist/client/index.html.
 *
 * Why: All routes in this app have `ssr: false` (ClientOnlyApp), so the server
 * renders an identical HTML shell for every URL. We capture it once and serve it
 * as a static file — turning the deployment into a plain SPA with no server needed.
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

async function main() {
  console.log("[generate-index] Loading SSR server bundle...");

  // Import the built server handler
  const serverModule = await import(
    resolve(root, "dist/server/server.js")
  ).catch((err) => {
    console.error("[generate-index] Failed to load dist/server/server.js:", err.message);
    process.exit(1);
  });

  const handler = serverModule.default;

  if (!handler || typeof handler.fetch !== "function") {
    console.error("[generate-index] server.js does not export a fetch handler.");
    process.exit(1);
  }

  console.log("[generate-index] Rendering HTML shell via SSR handler...");

  const req = new Request("http://localhost/");
  const res = await handler.fetch(req);

  if (!res.ok) {
    console.error(`[generate-index] SSR handler returned ${res.status}`);
    process.exit(1);
  }

  const html = await res.text();
  const outPath = resolve(root, "dist/client/index.html");

  writeFileSync(outPath, html, "utf-8");
  console.log(`[generate-index] Written ${html.length} bytes → ${outPath}`);
}

main();
