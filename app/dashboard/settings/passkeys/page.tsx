/** Passkeys settings — add, rename, and delete WebAuthn passkeys (platform or cross-platform). */
"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  extractError, extractData, formatError, formatDate, formatPasskeyDevice,
  Banner, type PasskeyRecord,
} from "@/app/dashboard/_lib/settings-helpers";

export default function PasskeysPage() {
  const { data: sessionData, isPending, refetch } = useSession();

  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [passkeyName, setPasskeyName] = useState("");
  const [passkeyDrafts, setPasskeyDrafts] = useState<Record<string, string>>({});
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPasskeySupported(typeof window !== "undefined" && "PublicKeyCredential" in window);
  }, []);

  useEffect(() => {
    setPasskeyDrafts(Object.fromEntries(passkeys.map((p) => [p.id, p.name ?? ""])));
  }, [passkeys]);

  const loadPasskeys = async () => {
    const result = await authClient.passkey.listUserPasskeys();
    setPasskeys(extractData<PasskeyRecord[]>(result, []));
  };

  useEffect(() => {
    if (!sessionData) return;
    void loadPasskeys();
  }, [sessionData]);

  const runBusy = async (key: string, work: () => Promise<void>) => {
    setBusyKey(key);
    setError("");
    try { await work(); } finally { setBusyKey(null); }
  };

  const handleAdd = async (attachment: "platform" | "cross-platform") => {
    await runBusy(`passkey-add-${attachment}`, async () => {
      const result = await authClient.passkey.addPasskey({
        name: passkeyName.trim() || undefined,
        authenticatorAttachment: attachment,
      });
      if (extractError(result)) {
        setError(formatError(result, "We could not register a new passkey."));
        return;
      }
      setNotice("Passkey added successfully.");
      setPasskeyName("");
      await loadPasskeys();
      await refetch();
    });
  };

  const handleRename = async (id: string) => {
    await runBusy(`passkey-rename-${id}`, async () => {
      const nextName = (passkeyDrafts[id] ?? "").trim();
      const result = await authClient.passkey.updatePasskey({ id, name: nextName || "Passkey" });
      if (extractError(result)) {
        setError(formatError(result, "We could not rename that passkey."));
        return;
      }
      setNotice("Passkey name updated.");
      await loadPasskeys();
    });
  };

  const handleDelete = async (id: string) => {
    await runBusy(`passkey-delete-${id}`, async () => {
      const result = await authClient.passkey.deletePasskey({ id });
      if (extractError(result)) {
        setError(formatError(result, "We could not remove that passkey."));
        return;
      }
      setNotice("Passkey removed.");
      await loadPasskeys();
    });
  };

  if (isPending) {
    return (
      <div className="panel p-8 text-sm text-zinc-500">
        Loading passkeys...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section flex items-center gap-2">
            <Fingerprint className="size-4 text-zinc-400" />
            Passkeys
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Add phishing-resistant sign-in on this device or a hardware security key.
          </p>
        </div>
        <div className="panel-body space-y-4">
          {passkeySupported ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  placeholder="Name this passkey (optional)"
                  className="bg-white/[0.03] border-white/[0.08]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleAdd("platform")}
                  disabled={!!busyKey}
                  className="h-9 text-[13px]"
                >
                  {busyKey === "passkey-add-platform" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  This device
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleAdd("cross-platform")}
                  disabled={!!busyKey}
                  className="h-9 text-[13px]"
                >
                  {busyKey === "passkey-add-cross-platform" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Security key
                </Button>
              </div>

              {passkeys.length > 0 ? (
                <div className="space-y-2">
                  {passkeys.map((passkey) => (
                    <div key={passkey.id} className="rounded-md border border-white/[0.06] p-4 hover:border-white/[0.1] transition-colors duration-150">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[13px] font-medium text-white">{formatPasskeyDevice(passkey)}</p>
                          <p className="mt-0.5 caption">Added {formatDate(passkey.createdAt)}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={passkeyDrafts[passkey.id] ?? ""}
                            onChange={(e) => setPasskeyDrafts((c) => ({ ...c, [passkey.id]: e.target.value }))}
                            placeholder="Rename"
                            className="sm:w-40 bg-white/[0.03] border-white/[0.08] h-8 text-[12px]"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void handleRename(passkey.id)}
                            disabled={busyKey === `passkey-rename-${passkey.id}`}
                            className="h-8 text-[12px]"
                          >
                            {busyKey === `passkey-rename-${passkey.id}` ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void handleDelete(passkey.id)}
                            disabled={busyKey === `passkey-delete-${passkey.id}`}
                            className="h-8 text-[12px] text-zinc-500 hover:text-white"
                          >
                            {busyKey === `passkey-delete-${passkey.id}` ? <Loader2 className="size-3.5 animate-spin" /> : "Remove"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-zinc-500">No passkeys added yet.</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
              This browser does not support passkeys.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
