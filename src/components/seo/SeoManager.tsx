import { useEffect } from "react";
import { useLocation } from "wouter";
import { buildMeta, canonicalUrl } from "@/lib/seo";

/**
 * Keeps <head> in sync with wouter navigation. The initial HTML already has the right tags
 * (rendered by the TanStack route head()); this updates them on client-side page changes.
 */
export function SeoManager() {
  const [location] = useLocation();

  useEffect(() => {
    for (const tag of buildMeta(location)) {
      if ("title" in tag) {
        document.title = tag.title;
        continue;
      }
      const attr = "property" in tag ? "property" : "name";
      const key = "property" in tag ? tag.property : tag.name;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = tag.content;
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl(location);
  }, [location]);

  return null;
}
