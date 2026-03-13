/** Privacy Policy placeholder — template guidance for deployers to fill in. */
import { LegalPlaceholderPage } from "@/components/legal-placeholder-page";

export default function PrivacyPage() {
  return (
    <LegalPlaceholderPage
      title="Privacy Policy"
      summary="The starter includes this route so you have a place to publish your own policy, but the content should reflect your product, vendors, retention rules, and jurisdiction."
      items={[
        "Describe what account, billing, upload, and support data your product actually collects.",
        "List the processors you use in production, such as Better Auth, Resend, Stripe, UploadThing, hosting, analytics, and customer support vendors.",
        "Document your retention and deletion behavior for users, uploaded files, audit records, and billing history.",
        "Add contact details, regional disclosures, and any rights language required for the countries you serve.",
      ]}
    />
  );
}
