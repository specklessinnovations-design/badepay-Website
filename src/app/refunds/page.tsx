import { LegalDocument } from "@/components/legal/LegalDocument";
import { REFUNDS_INTRO, REFUNDS_SECTIONS } from "@/content/legal/policies";

export default function RefundPolicyPage() {
  return <LegalDocument title="Refund & Dispute Policy" path="/refunds" intro={REFUNDS_INTRO} sections={REFUNDS_SECTIONS} />;
}
