import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl;
  const url = callbackUrl
    ? `/auth?tab=sign-in&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth?tab=sign-in";
  redirect(url);
}
