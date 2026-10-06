import { LegalDocument } from "@/components/legal/LegalDocument";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/content/legal/policies";

export default function TermsPage() {
  return <LegalDocument title="Terms & Conditions" path="/terms" intro={TERMS_INTRO} sections={TERMS_SECTIONS} />;
}
