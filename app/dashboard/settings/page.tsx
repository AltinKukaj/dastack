"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { hasPermission, parseUserRoles } from "@/lib/permissions";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings" },
];

interface SessionInfo {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  expiresAt: string | Date;
}

interface PasskeyInfo {
  id: string;
  name?: string | null;
  createdAt?: string | Date | null;
}

export default function SettingsPage() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [stripeEnabled, setStripeEnabled] = useState(false);

  const [name, setName] = useState("");
  const [usernameVal, setUsernameVal] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<
    "idle" | "password" | "qr" | "backup"
  >("idle");
  const [twoFAPassword, setTwoFAPassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [passkeyName, setPasskeyName] = useState("");
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [passkeyActionLoading, setPasskeyActionLoading] = useState<
    string | null
  >(null);
  const [passkeyMsg, setPasskeyMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/features")
      .then((r) => r.json())
      .then((data) => setStripeEnabled(data.stripe ?? false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setUsernameVal(
        ((session.user as Record<string, unknown>).username as string) ?? "",
      );
      setTwoFAEnabled(
        !!(session.user as Record<string, unknown>).twoFactorEnabled,
      );
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session) return;
    setSessionsLoading(true);
    authClient
      .listSessions()
      .then((res) => {
        if (res.data) setSessions(res.data as unknown as SessionInfo[]);
      })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    setPasskeysLoading(true);
    authClient.passkey
      .listUserPasskeys()
      .then((res) => {
        if (res.data) setPasskeys(res.data as PasskeyInfo[]);
      })
      .catch(() => {})
      .finally(() => setPasskeysLoading(false));
  }, [session]);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setProfileMsg(null);
    try {
      await authClient.updateUser({
        name,
        ...(usernameVal.trim() ? { username: usernameVal.trim() } : {}),
      });
      setProfileMsg("Profile updated.");
    } catch {
      setProfileMsg("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      setPwMsg({ type: "err", text: "Passwords do not match." });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({
        type: "err",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const result = await authClient.changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error(result.error.message);
      setPwMsg({
        type: "ok",
        text: "Password changed. Other sessions revoked.",
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      setPwMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setPwLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFAPassword) return;
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const result = await authClient.twoFactor.enable({
        password: twoFAPassword,
      });
      if (result.error) throw new Error(result.error.message);
      setTotpURI(result.data?.totpURI ?? null);
      setBackupCodes(result.data?.backupCodes ?? []);
      setTwoFAStep("qr");
    } catch (err: unknown) {
      setTwoFAError(
        err instanceof Error ? err.message : "Failed to enable 2FA.",
      );
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verifyCode.trim()) return;
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verifyCode.trim(),
      });
      if (result.error) throw new Error(result.error.message);
      setTwoFAEnabled(true);
      setTwoFAStep("backup");
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFAPassword) return;
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const result = await authClient.twoFactor.disable({
        password: twoFAPassword,
      });
      if (result.error) throw new Error(result.error.message);
      setTwoFAEnabled(false);
      setTwoFAStep("idle");
      setTwoFAPassword("");
    } catch (err: unknown) {
      setTwoFAError(
        err instanceof Error ? err.message : "Failed to disable 2FA.",
      );
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleRevokeSession = async (s: SessionInfo) => {
    setRevokingId(s.id);
    try {
      await authClient.revokeSession({ token: s.token });
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
    } catch {
      // silent
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setRevokingId("all");
    try {
      await authClient.revokeSessions();
      const res = await authClient.listSessions();
      if (res.data) setSessions(res.data as unknown as SessionInfo[]);
    } catch {
      // silent
    } finally {
      setRevokingId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    )
      return;
    setIsDeleting(true);
    try {
      await authClient.deleteUser({ callbackURL: "/" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddPasskey = async () => {
    setPasskeyActionLoading("add");
    setPasskeyMsg(null);
    try {
      const result = await authClient.passkey.addPasskey({
        ...(passkeyName.trim()
          ? { name: passkeyName.trim() }
          : { name: "This device" }),
      });
      if (result.error) throw new Error(result.error.message);
      const listed = await authClient.passkey.listUserPasskeys();
      if (listed.data) setPasskeys(listed.data as PasskeyInfo[]);
      setPasskeyName("");
      setPasskeyMsg({ type: "ok", text: "Passkey added successfully." });
    } catch (err: unknown) {
      setPasskeyMsg({
        type: "err",
        text:
          err instanceof Error ? err.message : "Could not register passkey.",
      });
    } finally {
      setPasskeyActionLoading(null);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setPasskeyActionLoading(id);
    setPasskeyMsg(null);
    try {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result.error) throw new Error(result.error.message);
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      setPasskeyMsg({ type: "ok", text: "Passkey removed." });
    } catch (err: unknown) {
      setPasskeyMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Could not delete passkey.",
      });
    } finally {
      setPasskeyActionLoading(null);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <span className="size-5 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
      </div>
    );
  }

  const displayName = session?.user.name ?? "User";
  const roleValue = (session?.user as Record<string, unknown> | undefined)
    ?.role;
  const roleTags = parseUserRoles(roleValue);
  const canManageBilling = hasPermission(roleValue, "billing:manage");

  return (
    <div className="flex min-h-screen bg-[#09090b] font-[family-name:var(--font-geist-sans)] text-white">
      <aside className="hidden w-48 shrink-0 border-r border-neutral-800/40 lg:flex lg:flex-col">
        <div className="px-5 py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-geist-mono)] text-[13px] tracking-tight text-white"
          >
            dastack
          </Link>
        </div>
        <nav className="flex-1 px-2 py-2">
          <ul className="space-y-0.5">
            {navItems
              .filter((i) => i.href !== "/dashboard/billing" || stripeEnabled)
              .map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block py-2 text-[13px] transition-colors ${active ? "border-l-2 border-white pl-[14px] font-medium text-white" : "pl-4 text-neutral-600 hover:text-neutral-300"}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>
        <div className="border-t border-neutral-800/40 p-3">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <UserAvatar
              image={session?.user.image}
              name={session?.user.name}
              email={session?.user.email}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-neutral-700">
                {session?.user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-neutral-800/40">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Link
                href="/"
                className="font-[family-name:var(--font-geist-mono)] text-[13px] lg:hidden"
              >
                dastack
              </Link>
              <span className="hidden text-[13px] text-neutral-600 lg:block">
                Settings
              </span>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg border border-neutral-800/60 px-3 py-1.5 text-xs text-neutral-600 transition hover:text-white"
            >
              Back to overview
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
            <div>
              <h1 className="font-[family-name:var(--font-geist-mono)] text-2xl tracking-tight text-white">
                Account settings
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Manage your profile, security, and active sessions.
              </p>
            </div>

            {/* Profile */}
            <section className="rounded-xl border border-neutral-800/60 p-5">
              <h2 className="text-sm font-medium text-white">Profile</h2>
              <div className="mt-4 flex items-center gap-4">
                <UserAvatar
                  image={session?.user.image}
                  name={session?.user.name}
                  email={session?.user.email}
                  large
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {session?.user.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {roleTags.map((role) => (
                      <span
                        key={role}
                        className="rounded-md border border-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400"
                      >
                        {role}
                      </span>
                    ))}
                    {canManageBilling && (
                      <span className="rounded-md border border-neutral-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                        billing-manage
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="display-name"
                    className="mb-1.5 block text-xs font-medium text-neutral-500"
                  >
                    Display name
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-white transition focus:border-neutral-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="username"
                    className="mb-1.5 block text-xs font-medium text-neutral-500"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={usernameVal}
                    onChange={(e) => setUsernameVal(e.target.value)}
                    placeholder="optional"
                    className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-white transition focus:border-neutral-600 focus:outline-none placeholder:text-neutral-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email-address"
                    className="mb-1.5 block text-xs font-medium text-neutral-500"
                  >
                    Email
                  </label>
                  <input
                    id="email-address"
                    type="text"
                    value={session?.user.email ?? ""}
                    disabled
                    className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-neutral-600 opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {profileMsg && (
                <p className="mt-3 text-xs text-neutral-400">{profileMsg}</p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  disabled={
                    isUpdating || (name === session?.user.name && !usernameVal)
                  }
                  className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save changes"}
                </button>
              </div>
            </section>

            {/* Security */}
            <section className="rounded-xl border border-neutral-800/60 p-5 space-y-4">
              <h2 className="text-sm font-medium text-white">Security</h2>

              {/* 2FA */}
              <div className="rounded-lg border border-neutral-800/60 p-4">
                <p className="text-sm font-medium text-white">Passkeys</p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  Passwordless sign-in with biometrics, PIN, or security keys.
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    placeholder="Name this device (optional)"
                    className="flex-1 rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-white outline-none transition focus:border-neutral-600 placeholder:text-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddPasskey}
                    disabled={passkeyActionLoading === "add"}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
                  >
                    {passkeyActionLoading === "add"
                      ? "Registering..."
                      : "Add passkey"}
                  </button>
                </div>

                <div className="mt-3 space-y-1.5">
                  {passkeysLoading ? (
                    <p className="text-xs text-neutral-700">
                      Loading passkeys...
                    </p>
                  ) : passkeys.length === 0 ? (
                    <p className="text-xs text-neutral-700">
                      No passkeys registered yet.
                    </p>
                  ) : (
                    passkeys.map((passkey) => (
                      <div
                        key={passkey.id}
                        className="flex items-center justify-between rounded-lg border border-neutral-800/60 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-neutral-300">
                            {passkey.name || "Unnamed passkey"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-neutral-700">
                            Added{" "}
                            {passkey.createdAt
                              ? new Date(passkey.createdAt).toLocaleDateString()
                              : "recently"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePasskey(passkey.id)}
                          disabled={passkeyActionLoading === passkey.id}
                          className="ml-3 shrink-0 rounded-md border border-red-900/50 px-2 py-1 text-[10px] font-medium text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
                        >
                          {passkeyActionLoading === passkey.id
                            ? "..."
                            : "Delete"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {passkeyMsg && (
                  <p
                    className={`mt-2 text-xs ${passkeyMsg.type === "ok" ? "text-neutral-400" : "text-red-400"}`}
                  >
                    {passkeyMsg.text}
                  </p>
                )}
              </div>

              {/* 2FA */}
              <div className="rounded-lg border border-neutral-800/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Two-factor authentication
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600">
                      {twoFAEnabled
                        ? "TOTP is enabled."
                        : "Add extra security with an authenticator app."}
                    </p>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${twoFAEnabled ? "border-neutral-700 text-white" : "border-neutral-800 text-neutral-600"}`}
                  >
                    {twoFAEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {twoFAStep === "idle" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFAStep("password");
                      setTwoFAPassword("");
                      setTwoFAError(null);
                    }}
                    className="mt-3 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:border-neutral-700 hover:text-white"
                  >
                    {twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </button>
                )}

                {twoFAStep === "password" && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label
                        htmlFor="twofa-pw"
                        className="mb-1 block text-xs text-neutral-600"
                      >
                        Enter your password
                      </label>
                      <input
                        id="twofa-pw"
                        type="password"
                        value={twoFAPassword}
                        onChange={(e) => setTwoFAPassword(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (twoFAEnabled
                            ? handleDisable2FA()
                            : handleEnable2FA())
                        }
                        className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-white outline-none transition focus:border-neutral-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={twoFALoading || !twoFAPassword}
                        onClick={
                          twoFAEnabled ? handleDisable2FA : handleEnable2FA
                        }
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
                      >
                        {twoFALoading
                          ? "..."
                          : twoFAEnabled
                            ? "Disable"
                            : "Continue"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTwoFAStep("idle")}
                        className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-500 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    {twoFAError && (
                      <p className="text-xs text-red-400">{twoFAError}</p>
                    )}
                  </div>
                )}

                {twoFAStep === "qr" && totpURI && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-neutral-500">
                      Scan with your authenticator app:
                    </p>
                    <div className="flex justify-center rounded-lg border border-neutral-800 bg-white p-4">
                      <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpURI)}`}
                        alt="TOTP QR Code"
                        width={200}
                        height={200}
                      />
                    </div>
                    <details className="text-xs text-neutral-600">
                      <summary className="cursor-pointer hover:text-white">
                        Can&apos;t scan? Copy URI
                      </summary>
                      <code className="mt-2 block break-all rounded-lg bg-neutral-900 p-3 text-neutral-400">
                        {totpURI}
                      </code>
                    </details>
                    <div>
                      <label
                        htmlFor="verify-totp"
                        className="mb-1 block text-xs text-neutral-600"
                      >
                        6-digit code
                      </label>
                      <input
                        id="verify-totp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) =>
                          setVerifyCode(e.target.value.replace(/\D/g, ""))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleVerify2FA()
                        }
                        placeholder="000000"
                        className="w-full rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-center font-mono text-lg tracking-[0.5em] text-white outline-none transition focus:border-neutral-600"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={twoFALoading || verifyCode.length < 6}
                      onClick={handleVerify2FA}
                      className="w-full rounded-lg bg-white px-3 py-2 text-xs font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
                    >
                      {twoFALoading ? "Verifying..." : "Verify & Enable"}
                    </button>
                    {twoFAError && (
                      <p className="text-xs text-red-400">{twoFAError}</p>
                    )}
                  </div>
                )}

                {twoFAStep === "backup" && backupCodes.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-white">
                        Save your backup codes
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Each code can only be used once.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-neutral-800 p-3 font-mono text-sm text-neutral-400">
                      {backupCodes.map((code) => (
                        <span key={code}>{code}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFAStep("idle");
                        setTwoFAPassword("");
                        setVerifyCode("");
                      }}
                      className="w-full rounded-lg bg-white px-3 py-2 text-xs font-medium text-black hover:bg-neutral-200"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="rounded-lg border border-neutral-800/60 p-4">
                <p className="text-sm font-medium text-white">
                  Change password
                </p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  This will revoke all other sessions.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Current"
                    className="rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-white outline-none transition focus:border-neutral-600 placeholder:text-neutral-700"
                  />
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="New"
                    className="rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-white outline-none transition focus:border-neutral-600 placeholder:text-neutral-700"
                  />
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Confirm"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleChangePassword()
                    }
                    className="rounded-lg border border-neutral-800 bg-transparent px-3 py-2 text-sm text-white outline-none transition focus:border-neutral-600 placeholder:text-neutral-700"
                  />
                </div>
                {pwMsg && (
                  <p
                    className={`mt-2 text-xs ${pwMsg.type === "ok" ? "text-neutral-400" : "text-red-400"}`}
                  >
                    {pwMsg.text}
                  </p>
                )}
                <button
                  type="button"
                  disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                  onClick={handleChangePassword}
                  className="mt-3 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:border-neutral-700 hover:text-white disabled:opacity-50"
                >
                  {pwLoading ? "Changing..." : "Change password"}
                </button>
              </div>

              {/* Sessions */}
              <div className="rounded-lg border border-neutral-800/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Active sessions
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600">
                      Manage devices where you&apos;re signed in.
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRevokeAllOther}
                      disabled={revokingId === "all"}
                      className="rounded-lg border border-red-900/50 px-3 py-1 text-[10px] font-medium text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
                    >
                      {revokingId === "all"
                        ? "Revoking..."
                        : "Revoke all others"}
                    </button>
                  )}
                </div>
                <div className="mt-3 space-y-1.5">
                  {sessionsLoading ? (
                    <p className="text-xs text-neutral-700">Loading...</p>
                  ) : sessions.length === 0 ? (
                    <p className="text-xs text-neutral-700">No sessions.</p>
                  ) : (
                    sessions.map((s) => {
                      const isCurrent = s.token === session?.session?.token;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border border-neutral-800/60 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-neutral-300">
                              {s.userAgent
                                ? parseUA(s.userAgent)
                                : "Unknown device"}
                              {isCurrent && (
                                <span className="ml-2 text-neutral-500">
                                  (current)
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[10px] text-neutral-700">
                              {s.ipAddress ?? "Unknown IP"} ·{" "}
                              {new Date(s.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(s)}
                              disabled={revokingId === s.id}
                              className="ml-3 shrink-0 rounded-md border border-neutral-800 px-2 py-1 text-[10px] font-medium text-neutral-500 transition hover:border-red-900/50 hover:text-red-400 disabled:opacity-50"
                            >
                              {revokingId === s.id ? "..." : "Revoke"}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="rounded-xl border border-red-900/30 p-5">
              <h2 className="text-sm font-medium text-red-300">Danger zone</h2>
              <p className="mt-1.5 text-xs text-neutral-600">
                Permanently delete your account and all associated data. This
                cannot be undone.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-medium text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete account"}
              </button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function parseUA(ua: string): string {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("curl")) return "curl";
  return ua.slice(0, 40);
}

function UserAvatar({
  image,
  name,
  email,
  large,
}: {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  large?: boolean;
}) {
  const size = large ? 48 : 28;
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "Avatar"}
        width={size}
        height={size}
        className="rounded border border-neutral-800 object-cover"
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded border border-neutral-800 font-[family-name:var(--font-geist-mono)] text-neutral-500 ${large ? "size-12 text-sm" : "size-7 text-[10px]"}`}
    >
      {(name?.[0] ?? email?.[0] ?? "?").toUpperCase()}
    </div>
  );
}
