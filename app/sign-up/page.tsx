import { redirect } from "next/navigation";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl;
  const url = callbackUrl
    ? `/auth?tab=sign-up&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth?tab=sign-up";
  redirect(url);
}
