import { LegalDocument } from "@/components/legal/LegalDocument";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/content/legal/privacy";

export default function PrivacyPolicyPage() {
  return <LegalDocument title="Privacy Policy" path="/privacy" intro={PRIVACY_INTRO} sections={PRIVACY_SECTIONS} />;
}
