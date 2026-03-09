/** Profile settings — display name update, email verification, and email change. */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractError, formatError, Banner } from "@/app/dashboard/_lib/settings-helpers";

export default function ProfilePage() {
  const router = useRouter();
  const { data: sessionData, isPending, refetch } = useSession();

  const user = sessionData?.user as {
    name?: string | null;
    email?: string | null;
    emailVerified?: boolean;
  } | undefined;

  const [profileName, setProfileName] = useState("");
  const [changeEmailValue, setChangeEmailValue] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setProfileName(user?.name ?? "");
    setChangeEmailValue(user?.email ?? "");
  }, [user?.email, user?.name]);

  const runBusy = async (key: string, work: () => Promise<void>) => {
    setBusyKey(key);
    setError("");
    try { await work(); } finally { setBusyKey(null); }
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runBusy("profile", async () => {
      const result = await authClient.updateUser({
        name: profileName,
      });
      if (extractError(result)) {
        setError(formatError(result, "We could not update your profile."));
        return;
      }
      setNotice("Your profile has been updated.");
      await refetch();
      router.refresh();
    });
  };

  const handleResendVerification = async () => {
    const email = user?.email;
    if (!email) return;
    await runBusy("verify", async () => {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/login?verified=1",
      });
      if (extractError(result)) {
        setError(formatError(result, "We could not resend the verification email."));
        return;
      }
      setNotice("Verification email sent. Check your inbox.");
    });
  };

  const handleChangeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runBusy("email", async () => {
      const result = await authClient.changeEmail({
        newEmail: changeEmailValue,
        callbackURL: "/dashboard/settings?notice=email-changed",
      });
      if (extractError(result)) {
        setError(formatError(result, "We could not start the email change flow."));
        return;
      }
      setNotice("Approve the change from your current email, then verify the new address from your inbox.");
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("notice") === "email-changed") {
      setNotice("Your new email has been verified and applied.");
    }
  }, []);

  if (isPending || !user) {
    return (
      <div className="panel p-8 text-sm text-zinc-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      {/* Profile section */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Profile</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Keep your public account details current.</p>
        </div>
        <div className="panel-body">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-[12px] text-zinc-400">Display name</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/[0.03] border-white/[0.08] focus:border-white/25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-[12px] text-zinc-400">Email</Label>
                <Input
                  id="profile-email"
                  value={user.email ?? ""}
                  disabled
                  className="bg-white/[0.02] border-white/[0.06] text-zinc-500"
                />
              </div>
            </div>
            <p className="text-[12px] text-zinc-500">
              Avatar management lives in the Files tab when uploads are enabled.
            </p>
            <Button type="submit" disabled={busyKey === "profile"} className="h-9 text-[13px]">
              {busyKey === "profile" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save changes
            </Button>
          </form>
        </div>
      </div>

      {/* Email section */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Email</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Verification status and email change.</p>
        </div>
        <div className="panel-body space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[13px] font-medium text-white">Verification status</h3>
              <p className="mt-1 text-[12px] text-zinc-500">
                {user.emailVerified
                  ? "Your email address is verified."
                  : "Verify your email to keep password sign-in available."}
              </p>
            </div>
            {!user.emailVerified && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerification}
                disabled={busyKey === "verify"}
                className="h-9 text-[13px] shrink-0"
              >
                {busyKey === "verify" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Resend email
              </Button>
            )}
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <h3 className="text-[13px] font-medium text-white">Change email</h3>
            <p className="mt-1 text-[12px] text-zinc-500">
              We&apos;ll ask you to approve the change from your current inbox, then verify the new address.
            </p>
            <form onSubmit={handleChangeEmail} className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                value={changeEmailValue}
                onChange={(e) => setChangeEmailValue(e.target.value)}
                placeholder="new-email@example.com"
                className="bg-white/[0.03] border-white/[0.08] focus:border-white/25"
              />
              <Button type="submit" disabled={busyKey === "email"} className="h-9 text-[13px] shrink-0">
                {busyKey === "email" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Change email
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
