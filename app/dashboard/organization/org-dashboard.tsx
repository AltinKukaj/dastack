/** Organization dashboard — org list/detail views, member management, invitations, and role-based permissions. */
"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc/client";
import { canPerform, type OrgRole } from "@/lib/org-permissions";
import {
    Building2,
    Users,
    Mail,
    Crown,
    Shield,
    User,
    UserPlus,
    Trash2,
    Check,
    Clock,
    ChevronRight,
    X,
} from "lucide-react";

interface OrgSummary {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    memberCount: number;
    createdAt: string;
}

interface OrgDashboardProps {
    organizations: OrgSummary[];
    userId: string;
}

type View = "list" | "detail";

export function OrgDashboard({ organizations: initialOrgs, userId }: OrgDashboardProps) {
    const { data: activeOrg } = authClient.useActiveOrganization();
    const [view, setView] = useState<View>(activeOrg ? "detail" : "list");

    if (!activeOrg || view === "list") {
        return (
            <OrgList
                organizations={initialOrgs}
                activeOrgId={activeOrg?.id}
                onSelect={() => setView("detail")}
            />
        );
    }

    return (
        <OrgDetail
            org={activeOrg}
            userId={userId}
            onBack={() => setView("list")}
        />
    );
}

/* ─── Org Detail View ─── */

function OrgDetail({
    org,
    userId,
    onBack,
}: {
    org: { id: string; name: string; slug: string; logo?: string | null; createdAt: string | Date };
    userId: string;
    onBack: () => void;
}) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data: myRole } = useQuery(
        trpc.organizations.myRole.queryOptions({ organizationId: org.id }),
    );
    const { data: members } = useQuery(
        trpc.organizations.members.queryOptions({ organizationId: org.id }),
    );

    // Only fetch invitations if the user has invite permissions
    const role = (myRole ?? "member") as OrgRole;
    const canInvite = canPerform(role, "member:invite");
    const canRemove = canPerform(role, "member:remove");
    const canUpdateRole = canPerform(role, "member:update-role");

    const { data: invitations } = useQuery({
        ...trpc.organizations.invitations.queryOptions({ organizationId: org.id }),
        enabled: canInvite,
    });
    const invalidateCacheMutation = useMutation(
        trpc.organizations.invalidateCache.mutationOptions(),
    );

    const [showInvite, setShowInvite] = useState(false);

    const memberList = members ?? [];
    const pendingInvitations = invitations ?? [];

    const invalidateOrg = useCallback(() => {
        void invalidateCacheMutation.mutateAsync({ organizationId: org.id }).catch(() => undefined);
        queryClient.invalidateQueries({ queryKey: [["organizations"]] });
    }, [invalidateCacheMutation, org.id, queryClient]);

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="link-subtle flex items-center gap-1 mb-2 text-[12px]"
                    >
                        All organizations
                        <ChevronRight className="size-3" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                            {org.logo ? (
                                <img
                                    src={org.logo}
                                    alt={org.name}
                                    className="size-10 rounded-md object-cover"
                                />
                            ) : (
                                <span className="text-sm font-bold uppercase">
                                    {org.name.slice(0, 2)}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="heading-page">{org.name}</h1>
                            <p className="caption font-mono">{org.slug}</p>
                        </div>
                    </div>
                </div>
                <RoleBadge role={role} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/[0.04] rounded-md overflow-hidden border border-white/[0.06]">
                <div className="bg-[#0a0a0c] px-4 py-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Users className="size-3.5 text-zinc-500" />
                        <span className="text-[11px] text-zinc-500">Members</span>
                    </div>
                    <p className="text-xl font-semibold text-white tabular-nums">{memberList.length}</p>
                </div>
                <div className="bg-[#0a0a0c] px-4 py-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Mail className="size-3.5 text-zinc-500" />
                        <span className="text-[11px] text-zinc-500">Pending</span>
                    </div>
                    <p className="text-xl font-semibold text-white tabular-nums">{pendingInvitations.length}</p>
                </div>
                <div className="bg-[#0a0a0c] px-4 py-4 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="size-3.5 text-zinc-500" />
                        <span className="text-[11px] text-zinc-500">Created</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                            new Date(org.createdAt)
                        )}
                    </p>
                </div>
            </div>

            {/* Members */}
            <div className="panel">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="heading-section">Members</h3>
                    {canInvite && (
                        <button
                            type="button"
                            onClick={() => setShowInvite(true)}
                            className="flex items-center gap-1.5 rounded-md bg-white text-black px-3 py-1.5 text-[12px] font-medium hover:bg-zinc-200 transition-colors"
                        >
                            <UserPlus className="size-3.5" />
                            Invite
                        </button>
                    )}
                </div>
                <div className="divide-y divide-white/[0.06]">
                    {memberList.map((member) => (
                        <MemberRow
                            key={member.id}
                            member={member}
                            isCurrentUser={member.userId === userId}
                            canRemove={canRemove}
                            canUpdateRole={canUpdateRole}
                            orgId={org.id}
                            onMutate={invalidateOrg}
                        />
                    ))}
                    {memberList.length === 0 && (
                        <div className="px-5 py-8 text-center">
                            <Users className="mx-auto size-5 text-zinc-600" />
                            <p className="mt-2 text-[13px] text-zinc-500">No members yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Invitations */}
            {canInvite && pendingInvitations.length > 0 && (
                <div className="panel">
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <h3 className="heading-section">Pending Invitations</h3>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                        {pendingInvitations.map((inv) => (
                            <InvitationRow
                                key={inv.id}
                                invitation={inv}
                                onMutate={invalidateOrg}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Invite dialog */}
            {showInvite && (
                <InviteDialog
                    orgId={org.id}
                    onClose={() => {
                        setShowInvite(false);
                        invalidateOrg();
                    }}
                />
            )}
        </div>
    );
}

/* ─── Org List View ─── */

function OrgList({
    organizations,
    activeOrgId,
    onSelect,
}: {
    organizations: OrgSummary[];
    activeOrgId?: string;
    onSelect: () => void;
}) {
    const handleSwitch = useCallback(
        async (orgId: string) => {
            await authClient.organization.setActive({ organizationId: orgId });
            onSelect();
        },
        [onSelect],
    );

    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <p className="section-label">Organization</p>
                <h1 className="mt-1 heading-page">Your organizations</h1>
            </div>

            {organizations.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {organizations.map((org) => (
                        <button
                            key={org.id}
                            type="button"
                            onClick={() => handleSwitch(org.id)}
                            className={`group panel panel-hover p-4 text-left flex items-center gap-4 ${activeOrgId === org.id ? "ring-1 ring-white/[0.15]" : ""
                                }`}
                        >
                            <div className="flex size-10 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 shrink-0">
                                {org.logo ? (
                                    <img
                                        src={org.logo}
                                        alt={org.name}
                                        className="size-10 rounded-md object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-bold uppercase">
                                        {org.name.slice(0, 2)}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium text-white truncate">
                                    {org.name}
                                </p>
                                <p className="caption font-mono">{org.slug}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[12px] text-zinc-500">
                                    {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                                </p>
                                {activeOrgId === org.id && (
                                    <span className="text-[10px] text-white">Active</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="panel p-8 text-center">
                    <Building2 className="mx-auto size-6 text-zinc-600" />
                    <p className="mt-3 text-[13px] text-zinc-500">
                        You&apos;re not part of any organization yet.
                    </p>
                    <p className="mt-1 text-[12px] text-zinc-600">
                        Create one from the sidebar or accept an invitation.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ─── Member Row ─── */

function MemberRow({
    member,
    isCurrentUser,
    canRemove,
    canUpdateRole,
    orgId,
    onMutate,
}: {
    member: {
        id: string;
        userId: string;
        role: string;
        userName: string;
        userEmail: string;
        userImage: string | null;
        joinedAt: string;
    };
    isCurrentUser: boolean;
    canRemove: boolean;
    canUpdateRole: boolean;
    orgId: string;
    onMutate: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleRemove = async () => {
        if (!confirm(`Remove ${member.userName} from this organization?`)) return;
        setLoading(true);
        try {
            await authClient.organization.removeMember({
                memberIdOrEmail: member.userId,
                organizationId: orgId,
            });
            onMutate();
        } catch (err) {
            console.error("[org] Failed to remove member:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (newRole: string) => {
        setLoading(true);
        try {
            await authClient.organization.updateMemberRole({
                memberId: member.id,
                role: newRole as OrgRole,
                organizationId: orgId,
            });
            onMutate();
        } catch (err) {
            console.error("[org] Failed to update role:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex size-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 shrink-0">
                {member.userImage ? (
                    <img
                        src={member.userImage}
                        alt={member.userName}
                        className="size-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <span className="text-[11px] font-medium uppercase">
                        {member.userName.slice(0, 2)}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-[13px] text-white truncate">{member.userName}</p>
                    {isCurrentUser && (
                        <span className="text-[10px] text-zinc-600 border border-white/[0.06] rounded px-1.5 py-0.5">
                            You
                        </span>
                    )}
                </div>
                <p className="caption truncate">{member.userEmail}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {canUpdateRole && !isCurrentUser && member.role !== "owner" ? (
                    <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        disabled={loading}
                        className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[11px] text-zinc-300 outline-none cursor-pointer"
                    >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                    </select>
                ) : (
                    <RoleBadge role={member.role as OrgRole} />
                )}
                {canRemove && !isCurrentUser && member.role !== "owner" && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={loading}
                        className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                        title="Remove member"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─── Invitation Row ─── */

function InvitationRow({
    invitation,
    onMutate,
}: {
    invitation: {
        id: string;
        email: string;
        role: string | null;
        status: string;
        inviterName: string;
        createdAt: string;
        expiresAt: string;
    };
    onMutate: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        setLoading(true);
        try {
            await authClient.organization.cancelInvitation({
                invitationId: invitation.id,
            });
            onMutate();
        } catch (err) {
            console.error("[org] Failed to cancel invitation:", err);
        } finally {
            setLoading(false);
        }
    };

    const isExpired = new Date(invitation.expiresAt) < new Date();

    return (
        <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex size-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 shrink-0">
                <Mail className="size-3.5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white truncate">{invitation.email}</p>
                <p className="caption">
                    {invitation.role ?? "member"} &middot;{" "}
                    {isExpired ? (
                        <span className="text-zinc-400">Expired</span>
                    ) : (
                        `Expires ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                            new Date(invitation.expiresAt)
                        )}`
                    )}
                </p>
            </div>
            <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="p-1.5 rounded-md text-zinc-600 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                title="Cancel invitation"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}

/* ─── Invite Dialog ─── */

function InviteDialog({ orgId, onClose }: { orgId: string; onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member">("member");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const { error: apiError } = await authClient.organization.inviteMember({
                email: email.trim(),
                role,
                organizationId: orgId,
            });

            if (apiError) {
                setError(apiError.message ?? "Failed to send invitation");
                return;
            }

            setSuccess(true);
            setTimeout(onClose, 1500);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 animate-fade-in"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md rounded-md bg-[#111113] border border-white/[0.06] p-6 animate-fade-in">
                <h2 className="text-[15px] font-semibold text-white mb-1">
                    Invite Member
                </h2>
                <p className="text-[13px] text-zinc-500 mb-5">
                    Send an invitation to join this organization.
                </p>

                {success ? (
                    <div className="flex items-center gap-2 text-zinc-300 py-4">
                        <Check className="size-4" />
                        <span className="text-[13px]">Invitation sent to {email}</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[12px] text-zinc-400 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teammate@company.com"
                                className="w-full rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:border-white/25 transition-colors"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] text-zinc-400 mb-1.5">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as "admin" | "member")}
                                className="w-full rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-[13px] text-white outline-none cursor-pointer"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {error && <p className="text-[12px] text-zinc-400">{error}</p>}

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
                                disabled={loading || !email.trim()}
                                className="flex-1 rounded-md px-4 py-2 text-[13px] font-medium bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? "Sending..." : "Send Invite"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Role Badge ─── */

function RoleBadge({ role }: { role: OrgRole | string }) {
    const config = {
        owner: { icon: Crown, label: "Owner", color: "text-white bg-white/[0.06] border-white/[0.1]" },
        admin: { icon: Shield, label: "Admin", color: "text-zinc-300 bg-white/[0.04] border-white/[0.08]" },
        member: { icon: User, label: "Member", color: "text-zinc-400 bg-white/[0.04] border-white/[0.06]" },
    };

    const c = config[role as OrgRole] ?? config.member;
    const Icon = c.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${c.color}`}>
            <Icon className="size-3" />
            {c.label}
        </span>
    );
}
