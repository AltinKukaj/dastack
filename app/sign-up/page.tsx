import { redirect } from "next/navigation";
import { getSafeCallbackUrl } from "@/lib/safe-callback-url";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl, "/dashboard");
  const url = callbackUrl
    ? `/auth?tab=sign-up&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth?tab=sign-up";
  redirect(url);
}
