import { LegalDocument } from "@/components/legal/LegalDocument";
import { COOKIES_INTRO, COOKIES_SECTIONS } from "@/content/legal/policies";

export default function CookiePolicyPage() {
  return <LegalDocument title="Cookie Policy" path="/cookies" intro={COOKIES_INTRO} sections={COOKIES_SECTIONS} />;
}
