import { createFileRoute } from "@tanstack/react-router";
import { ClientOnlyApp } from "@/ClientOnlyApp";
import { buildMeta, canonicalUrl } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  ssr: false,
  head: ({ params }) => {
    const pathname = `/${params._splat ?? ""}`;
    return {
      meta: buildMeta(pathname),
      links: [{ rel: "canonical", href: canonicalUrl(pathname) }],
    };
  },
  component: ClientOnlyApp,
});
