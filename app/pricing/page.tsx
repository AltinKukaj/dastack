import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getStripeBillingReadiness } from "@/lib/features";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: `Pricing - ${APP_NAME}`,
  description:
    "Free, Pro, and Team plans. Start free and upgrade when you need more.",
};

// Read Stripe config at request time so production env vars are used (not build-time)
export const dynamic = "force-dynamic";

export default function PricingPage() {
  return <PricingClient billingReadiness={getStripeBillingReadiness()} />;
}
