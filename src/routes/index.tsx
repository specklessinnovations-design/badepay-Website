import { createFileRoute } from "@tanstack/react-router";
import { ClientOnlyApp } from "@/ClientOnlyApp";
import { buildMeta, canonicalUrl, STRUCTURED_DATA } from "@/lib/seo";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: buildMeta("/"),
    links: [{ rel: "canonical", href: canonicalUrl("/") }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(STRUCTURED_DATA) }],
  }),
  component: ClientOnlyApp,
});
