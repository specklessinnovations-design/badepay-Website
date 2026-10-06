import { LegalDocument } from "@/components/legal/LegalDocument";
import { AML_INTRO, AML_SECTIONS } from "@/content/legal/policies";

export default function AmlKycPolicyPage() {
  return <LegalDocument title="AML & KYC Policy" path="/aml-kyc" intro={AML_INTRO} sections={AML_SECTIONS} />;
}
