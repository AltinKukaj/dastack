"use client";

import { useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Plus, Building2, Check } from "lucide-react";

interface OrgSwitcherProps {
    /** When `true` the sidebar is collapsed — only the org icon is shown. */
    collapsed?: boolean;
}

/**
 * Organization switcher dropdown.
 *
 * Lists the user's organizations, lets them switch the active org or
 * revert to the personal workspace, and opens an inline dialog to
 * create a new organization.
 */
export function OrgSwitcher({ collapsed = false }: OrgSwitcherProps) {
    const { data: organizations } = authClient.useListOrganizations();
    const { data: activeOrg } = authClient.useActiveOrganization();
    const [switching, setSwitching] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    const handleSwitch = useCallback(
        async (orgId: string) => {
            if (switching) return;
            setSwitching(true);
            try {
                await authClient.organization.setActive({
                    organizationId: orgId,
                });
            } catch (err) {
                console.error("[org] Failed to switch:", err);
            } finally {
                setSwitching(false);
            }
        },
        [switching],
    );

    const handleClearOrg = useCallback(async () => {
        if (switching) return;
        setSwitching(true);
        try {
            // Passing `null` clears the active org (personal workspace).
            // Better Auth accepts null at runtime but the SDK types expect string.
            await authClient.organization.setActive({
                organizationId: null as unknown as string,
            });
        } catch (err) {
            console.error("[org] Failed to clear active org:", err);
        } finally {
            setSwitching(false);
        }
    }, [switching]);

    const orgList = organizations ?? [];

    return (
        <>
            <div className="px-2 py-1.5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors duration-150 hover:bg-white/[0.04] outline-none text-left ${collapsed ? "justify-center" : ""}`}
                        >
                            {/* Org icon */}
                            <div className="flex size-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 shrink-0">
                                {activeOrg ? (
                                    activeOrg.logo ? (
                                        <img
                                            src={activeOrg.logo}
                                            alt={activeOrg.name}
                                            className="size-6 rounded-md object-cover"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase">
                                            {activeOrg.name.slice(0, 2)}
                                        </span>
                                    )
                                ) : (
                                    <Building2 className="size-3.5" />
                                )}
                            </div>

                            {!collapsed && (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] text-zinc-500 leading-none mb-0.5">
                                            Organization
                                        </p>
                                        <p className="text-[13px] text-white truncate leading-tight">
                                            {activeOrg?.name ?? "Personal"}
                                        </p>
                                    </div>
                                    <ChevronsUpDown className="size-3.5 text-zinc-600 shrink-0" />
                                </>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="right" className="w-64">
                        {/* Personal workspace */}
                        <DropdownMenuItem
                            onSelect={handleClearOrg}
                            className="flex items-center gap-2 text-zinc-300 cursor-pointer"
                        >
                            <div className="flex size-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                                <Building2 className="size-3.5" />
                            </div>
                            <span className="flex-1 text-[13px]">Personal</span>
                            {!activeOrg && <Check className="size-3.5 text-white" />}
                        </DropdownMenuItem>

                        {orgList.length > 0 && <DropdownMenuSeparator />}

                        {orgList.map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onSelect={() => handleSwitch(org.id)}
                                className="flex items-center gap-2 text-zinc-300 cursor-pointer"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                                    {org.logo ? (
                                        <img
                                            src={org.logo}
                                            alt={org.name}
                                            className="size-6 rounded-md object-cover"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase">
                                            {org.name.slice(0, 2)}
                                        </span>
                                    )}
                                </div>
                                <span className="flex-1 text-[13px] truncate">{org.name}</span>
                                {activeOrg?.id === org.id && (
                                    <Check className="size-3.5 text-white" />
                                )}
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onSelect={() => setShowCreate(true)}
                            className="flex items-center gap-2 text-zinc-400 cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span className="text-[13px]">Create Organization</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {showCreate && <CreateOrgDialog onClose={() => setShowCreate(false)} />}
        </>
    );
}

// ---------------------------------------------------------------------------
// Inline Create Organization dialog
// ---------------------------------------------------------------------------

/**
 * Modal dialog for creating a new organization.
 * Auto-generates a URL slug from the org name.
 */
function CreateOrgDialog({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 48);
    };

    const handleNameChange = (value: string) => {
        setName(value);
        setSlug(generateSlug(value));
    };

    const handleSubmit = async () => {
        if (!name.trim() || !slug.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const { error: apiError } = await authClient.organization.create({
                name: name.trim(),
                slug: slug.trim(),
            });

            if (apiError) {
                setError(apiError.message ?? "Failed to create organization");
                return;
            }

            onClose();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 animate-fade-in"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-md rounded-md bg-[#111113] border border-white/[0.06] p-6 animate-fade-in">
                <h2 className="text-[15px] font-semibold text-white mb-1">
                    Create Organization
                </h2>
                <p className="text-[13px] text-zinc-500 mb-5">
                    Create a workspace for your team.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[12px] text-zinc-400 mb-1.5">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Acme Inc."
                            className="w-full rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:border-white/25 transition-colors"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] text-zinc-400 mb-1.5">
                            URL Slug
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(generateSlug(e.target.value))}
                            placeholder="acme-inc"
                            className="w-full rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:border-white/25 transition-colors font-mono"
                        />
                    </div>

                    {error && (
                        <p className="text-[12px] text-zinc-400">{error}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md px-4 py-2 text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !name.trim() || !slug.trim()}
                            className="flex-1 rounded-md px-4 py-2 text-[13px] font-medium bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
