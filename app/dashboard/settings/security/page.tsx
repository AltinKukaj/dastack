/** Security settings — password change, 2FA setup/disable, and backup code management. */
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldCheck, Lock } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { APP_NAME } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  extractError, extractData, formatError,
  Banner, type AccountRecord, type TwoFactorSetup,
} from "@/app/dashboard/_lib/settings-helpers";

export default function SecurityPage() {
  const router = useRouter();
  const { data: sessionData, isPending, refetch } = useSession();

  const user = sessionData?.user as {
    name?: string | null;
    email?: string | null;
    twoFactorEnabled?: boolean | null;
  } | undefined;

  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const hasCredentialAccount = useMemo(
    () => accounts.some((a) => a.providerId === "credential"),
    [accounts],
  );

  useEffect(() => {
    if (!sessionData) return;
    void authClient.listAccounts().then((r) => {
      setAccounts(extractData<AccountRecord[]>(r, []));
    });
  }, [sessionData]);

  const runBusy = async (key: string, work: () => Promise<void>) => {
    setBusyKey(key);
    setError("");
    try { await work(); } finally { setBusyKey(null); }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const revokeOtherSessions = form.get("revokeOtherSessions") === "on";

    if (newPassword !== confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    await runBusy("password", async () => {
      const result = await authClient.changePassword({
        currentPassword, newPassword, revokeOtherSessions,
      });
      if (extractError(result)) {
        setError(formatError(result, "We could not update your password."));
        return;
      }
      setNotice("Password updated successfully.");
      (event.currentTarget as HTMLFormElement).reset();
    });
  };

  const handleEnableTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    await runBusy("twofactor-enable", async () => {
      const result = await authClient.twoFactor.enable({ password, issuer: APP_NAME });
      if (extractError(result)) {
        setError(formatError(result, "We could not start two-factor setup."));
        return;
      }
      const data = extractData<TwoFactorSetup>(result, { totpURI: "", backupCodes: [] });
      setTwoFactorSetup(data);
      setBackupCodes(data.backupCodes);
      setNotice("Scan the QR code, then confirm with the code from your authenticator app.");
    });
  };

  const handleVerifyTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "");

    await runBusy("twofactor-verify", async () => {
      const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: true });
      if (extractError(result)) {
        setError(formatError(result, "We could not verify your authenticator code."));
        return;
      }
      setNotice("Two-factor authentication is now enabled.");
      setTwoFactorSetup(null);
      await refetch();
      router.refresh();
    });
  };

  const handleDisableTwoFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    await runBusy("twofactor-disable", async () => {
      const result = await authClient.twoFactor.disable({ password });
      if (extractError(result)) {
        setError(formatError(result, "We could not disable two-factor authentication."));
        return;
      }
      setNotice("Two-factor authentication has been disabled.");
      setBackupCodes([]);
      await refetch();
      router.refresh();
    });
  };

  const handleRegenerateBackupCodes = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    await runBusy("twofactor-backups", async () => {
      const result = await authClient.twoFactor.generateBackupCodes({ password });
      if (extractError(result)) {
        setError(formatError(result, "We could not regenerate your backup codes."));
        return;
      }
      const data = extractData<{ backupCodes: string[] }>(result, { backupCodes: [] });
      setBackupCodes(data.backupCodes);
      setNotice("New backup codes generated. Store them somewhere safe.");
    });
  };

  if (isPending || !user) {
    return (
      <div className="panel p-8 text-sm text-zinc-500">
        Loading security settings...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      {/* Password section */}
      {hasCredentialAccount && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="heading-section flex items-center gap-2">
              <Lock className="size-4 text-zinc-400" />
              Password
            </h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">Update your password and optionally sign out every other device.</p>
          </div>
          <div className="panel-body">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-[12px] text-zinc-400">Current</Label>
                  <Input id="current-password" name="currentPassword" type="password" required className="bg-white/[0.03] border-white/[0.08]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-[12px] text-zinc-400">New</Label>
                  <Input id="new-password" name="newPassword" type="password" minLength={8} required className="bg-white/[0.03] border-white/[0.08]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-[12px] text-zinc-400">Confirm</Label>
                  <Input id="confirm-password" name="confirmPassword" type="password" minLength={8} required className="bg-white/[0.03] border-white/[0.08]" />
                </div>
              </div>
              <label className="flex items-center gap-3 text-[12px] text-zinc-500 cursor-pointer">
                <input type="checkbox" name="revokeOtherSessions" className="size-3.5 rounded border-zinc-700 bg-transparent accent-white" />
                Sign out my other sessions
              </label>
              <Button type="submit" disabled={busyKey === "password"} className="h-9 text-[13px]">
                {busyKey === "password" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Update password
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Two-factor section */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section flex items-center gap-2">
            <ShieldCheck className="size-4 text-zinc-400" />
            Two-factor authentication
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Add an authenticator app for stronger sign-in protection.</p>
        </div>
        <div className="panel-body space-y-5">
          {!user.twoFactorEnabled ? (
            <div className="space-y-4">
              <form onSubmit={handleEnableTwoFactor} className="flex flex-col gap-3 sm:flex-row">
                <Input name="password" type="password" required placeholder="Confirm your password" className="bg-white/[0.03] border-white/[0.08]" />
                <Button type="submit" disabled={busyKey === "twofactor-enable"} className="h-9 text-[13px] shrink-0">
                  {busyKey === "twofactor-enable" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Start setup
                </Button>
              </form>

              {twoFactorSetup?.totpURI && (
                <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
                  <div className="flex justify-center">
                    <Image
                      src={`https://quickchart.io/qr?text=${encodeURIComponent(twoFactorSetup.totpURI)}&size=200`}
                      alt="Two-factor QR code"
                      width={180}
                      height={180}
                      className="rounded-md border border-white/[0.08] bg-white p-3"
                    />
                  </div>
                  <details className="text-[11px] text-zinc-600">
                    <summary className="cursor-pointer hover:text-white transition-colors duration-150">
                      Can&apos;t scan? Copy URI
                    </summary>
                    <code className="mt-2 block overflow-x-auto break-all rounded-md border border-white/[0.08] bg-black/30 p-3 text-[11px] text-zinc-300">
                      {twoFactorSetup.totpURI}
                    </code>
                  </details>

                  <Separator className="bg-white/[0.06]" />

                  <form onSubmit={handleVerifyTwoFactor} className="flex flex-col gap-3 sm:flex-row">
                    <Input name="code" type="text" required placeholder="6-digit code" autoComplete="one-time-code" className="bg-white/[0.03] border-white/[0.08]" />
                    <Button type="submit" disabled={busyKey === "twofactor-verify"} className="h-9 text-[13px] shrink-0">
                      {busyKey === "twofactor-verify" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                      Confirm 2FA
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
                Two-factor authentication is enabled for this account.
              </div>

              <form onSubmit={handleRegenerateBackupCodes} className="flex flex-col gap-3 sm:flex-row">
                <Input name="password" type="password" required placeholder="Password to regenerate backup codes" className="bg-white/[0.03] border-white/[0.08]" />
                <Button type="submit" variant="outline" disabled={busyKey === "twofactor-backups"} className="h-9 text-[13px] shrink-0">
                  {busyKey === "twofactor-backups" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  New backup codes
                </Button>
              </form>

              <form onSubmit={handleDisableTwoFactor} className="flex flex-col gap-3 sm:flex-row">
                <Input name="password" type="password" required placeholder="Password to disable 2FA" className="bg-white/[0.03] border-white/[0.08]" />
                <Button type="submit" variant="outline" disabled={busyKey === "twofactor-disable"} className="h-9 text-[13px] shrink-0">
                  {busyKey === "twofactor-disable" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Disable 2FA
                </Button>
              </form>
            </div>
          )}

          {backupCodes.length > 0 && (
            <div className="rounded-md border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-zinc-300">
                <AlertTriangle className="size-3.5" />
                Backup codes -- save these somewhere safe
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {backupCodes.map((code) => (
                  <code key={code} className="rounded-md border border-white/[0.06] bg-black/20 px-3 py-2 text-[12px] text-zinc-200 font-mono">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
