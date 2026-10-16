import { createFileRoute } from "@tanstack/react-router";
import { ClientOnlyApp } from "@/ClientOnlyApp";
import { buildMeta, canonicalUrl } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  head: ({ params }) => {
    // TanStack splat may be "dashboard" or "merchant/payments" without a leading slash
    const raw = (params as { _splat?: string })._splat ?? "";
    const pathname = raw.startsWith("/") ? raw : `/${raw}`;
    return {
      meta: buildMeta(pathname),
      links: [{ rel: "canonical", href: canonicalUrl(pathname) }],
    };
  },
  component: ClientOnlyApp,
});
