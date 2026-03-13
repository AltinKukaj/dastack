/** Terms of Service placeholder — template guidance for deployers to fill in. */
import { LegalPlaceholderPage } from "@/components/legal-placeholder-page";

export default function TermsPage() {
  return (
    <LegalPlaceholderPage
      title="Terms of Service"
      summary="This starter ships the route and styling for a terms page, but not final legal language. Replace the copy with terms that match your product, pricing model, and support obligations."
      items={[
        "Define who can use the product, how accounts are created, and what conduct is prohibited.",
        "Describe subscriptions, billing changes, renewals, refunds, and cancellation rules for the providers you enable.",
        "Set expectations around uptime, support, data loss, limitation of liability, and acceptable use for uploaded content.",
        "Add governing law, dispute terms, and any product-specific clauses your counsel requires before launch.",
      ]}
    />
  );
}
