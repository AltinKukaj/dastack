/** Sessions settings — list active sessions, revoke individual/all, and view linked sign-in methods. */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LaptopMinimal, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  extractError, extractData, formatError, formatDate, deviceLabel,
  providerLabel, formatLoginMethod, Banner,
  type SessionRecord, type AccountRecord,
} from "@/app/dashboard/_lib/settings-helpers";

export default function SessionsPage() {
  const router = useRouter();
  const { data: sessionData, isPending } = useSession();

  const user = sessionData?.user as {
    lastLoginMethod?: string | null;
  } | undefined;
  const session = sessionData?.session as { token?: string } | undefined;

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    const [sessionResult, accountResult] = await Promise.all([
      authClient.listSessions(),
      authClient.listAccounts(),
    ]);
    setSessions(extractData<SessionRecord[]>(sessionResult, []));
    setAccounts(extractData<AccountRecord[]>(accountResult, []));
  };

  useEffect(() => {
    if (!sessionData) return;
    void loadData();
  }, [sessionData]);

  const runBusy = async (key: string, work: () => Promise<void>) => {
    setBusyKey(key);
    setError("");
    try { await work(); } finally { setBusyKey(null); }
  };

  const handleRevokeSession = async (token: string) => {
    await runBusy(`revoke-${token}`, async () => {
      const result = await authClient.revokeSession({ token });
      if (extractError(result)) {
        setError(formatError(result, "We could not revoke that session."));
        return;
      }
      setNotice("Session revoked.");
      if (token === session?.token) {
        router.push("/login");
        return;
      }
      await loadData();
    });
  };

  const handleRevokeOtherSessions = async () => {
    await runBusy("revoke-others", async () => {
      const result = await authClient.revokeOtherSessions();
      if (extractError(result)) {
        setError(formatError(result, "We could not revoke your other sessions."));
        return;
      }
      setNotice("Signed out of your other sessions.");
      await loadData();
    });
  };

  if (isPending) {
    return (
      <div className="panel p-8 text-sm text-zinc-500">
        Loading sessions...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      {/* Active sessions */}
      <div className="panel">
        <div className="panel-header flex items-center justify-between">
          <div>
            <h2 className="heading-section flex items-center gap-2">
              <LaptopMinimal className="size-4 text-zinc-400" />
              Active sessions
            </h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Review where you&apos;re signed in and revoke access you no longer trust.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleRevokeOtherSessions}
            disabled={busyKey === "revoke-others"}
            className="h-8 text-[12px] shrink-0"
          >
            {busyKey === "revoke-others" ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            Revoke others
          </Button>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {sessions.map((s) => {
            const isCurrent = s.token === session?.token;
            return (
              <div key={s.token} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-white">{deviceLabel(s.userAgent)}</p>
                    {isCurrent && (
                      <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 caption">
                    {s.ipAddress || "Unknown IP"} · Expires {formatDate(s.expiresAt)}
                  </p>
                  <p className="text-[11px] text-zinc-600">Started {formatDate(s.createdAt)}</p>
                </div>
                {!isCurrent && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRevokeSession(s.token)}
                    disabled={busyKey === `revoke-${s.token}`}
                    className="h-8 text-[12px] text-zinc-500 hover:text-white"
                  >
                    {busyKey === `revoke-${s.token}` ? <Loader2 className="size-3.5 animate-spin" /> : "Revoke"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign-in methods */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Sign-in methods</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Accounts currently linked to your user.{" "}
            {user?.lastLoginMethod && `Latest: ${formatLoginMethod(user.lastLoginMethod)}.`}
          </p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <div
                key={`${account.providerId}-${account.accountId ?? "primary"}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150"
              >
                <div>
                  <p className="text-[13px] font-medium text-white">{providerLabel(account.providerId)}</p>
                  <p className="mt-0.5 caption">Added {formatDate(account.createdAt)}</p>
                </div>
                <Check className="size-4 text-white" />
              </div>
            ))
          ) : (
            <div className="px-5 py-6">
              <p className="text-[12px] text-zinc-500">No linked accounts found yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
