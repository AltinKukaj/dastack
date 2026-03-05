import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!auth) redirect("/");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth?callbackUrl=/dashboard");

  return <>{children}</>;
}
