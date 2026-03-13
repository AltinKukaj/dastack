/** Danger zone — permanent account deletion with password and "DELETE" confirmation. */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractError, extractData, formatError, Banner } from "@/app/dashboard/_lib/settings-helpers";

export default function DangerPage() {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleDeleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "").trim();
    const confirmation = String(form.get("confirmation") ?? "").trim();

    if (confirmation !== "DELETE") {
      setError('Type "DELETE" to confirm account deletion.');
      return;
    }

    setBusyKey("delete-account");
    setError("");

    try {
      const result = await authClient.deleteUser(
        password ? { password, callbackURL: "/" } : { callbackURL: "/" },
      );

      if (extractError(result)) {
        setError(formatError(result, "We could not start account deletion."));
        return;
      }

      const nextSession = await authClient.getSession();
      const nextData = extractData(nextSession, null);

      if (!nextData) {
        router.push("/");
        return;
      }

      setNotice("Deletion requested. If email confirmation is required, check your inbox to finish deleting your account.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {notice && <Banner tone="success">{notice}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="rounded-md border border-white/[0.08] bg-white/[0.02]">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="heading-section text-zinc-200 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Delete account
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Permanently delete your account and all associated auth data. This action cannot be undone.
          </p>
        </div>
        <div className="panel-body">
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password" className="text-[12px] text-zinc-400">
                Current password (optional if email confirmation is used)
              </Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                placeholder="Your password"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation" className="text-[12px] text-zinc-400">
                Type DELETE to confirm
              </Label>
              <Input
                id="delete-confirmation"
                name="confirmation"
                placeholder="DELETE"
                className="bg-white/[0.03] border-white/[0.08] focus:border-white/25"
              />
            </div>
            <Button type="submit" variant="destructive" disabled={busyKey === "delete-account"} className="h-9 text-[13px]">
              {busyKey === "delete-account" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Delete account permanently
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
