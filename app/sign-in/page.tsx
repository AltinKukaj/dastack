import { redirect } from "next/navigation";
import { authDebug } from "@/lib/auth-debug";
import { getSafeCallbackUrl } from "@/lib/safe-callback-url";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl, "/dashboard");
  const url = callbackUrl
    ? `/auth?tab=sign-in&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth?tab=sign-in";
  authDebug("sign_in_page.redirect_auth", {
    rawCallbackUrl: params.callbackUrl ?? null,
    safeCallbackUrl: callbackUrl,
    redirectTo: url,
  });
  redirect(url);
}
