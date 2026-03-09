/** Admin dashboard — system stats, user management, audit log, and user detail modals. */
"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import {
  describeAuditMetadata,
  formatAction,
  formatDate,
} from "./admin-utils";
import {
  Activity,
  Ban,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

interface Stats {
  userCount: number;
  sessionCount: number;
  orgCount: number;
  subscriptionCount: number;
}

interface SystemReport {
  auditEvents24h: number;
  loginFailures24h: number;
  activeSubscriptions: number;
  pendingWebhooks: number;
  deadWebhooks: number;
  assetCount: number;
  subscriptionBreakdown: Array<{
    plan: string;
    status: string;
    count: number;
  }>;
}

interface AuditEventItem {
  id: string;
  actorId: string | null;
  actorType: string;
  subjectType: string;
  subjectId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string | null;
  banned: boolean | null;
  image: string | null;
  createdAt: string;
  lastLoginMethod: string | null;
  sessionCount: number;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  image: string | null;
  createdAt: string;
  lastLoginMethod: string | null;
  counts: {
    sessions: number;
    accounts: number;
    passkeys: number;
  };
  sessions: Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
  }>;
  subscriptions: Array<{
    id: string;
    plan: string;
    status: string | null;
    periodStart: string | null;
    periodEnd: string | null;
  }>;
  entitlements: {
    plan: string;
    limits: Record<string, { limit: number; used: number; remaining: number }>;
  };
  auditEvents: AuditEventItem[];
}

interface AdminDashboardProps {
  stats: Stats;
  report: SystemReport;
  initialUsers: UserItem[];
  totalUsers: number;
  initialAuditEvents: AuditEventItem[];
  auditTotal: number;
}

export function AdminDashboard({
  stats,
  report,
  initialUsers,
  totalUsers,
  initialAuditEvents,
  auditTotal,
}: AdminDashboardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const limit = 20;

  const { data: usersData } = useQuery({
    ...trpc.admin.users.queryOptions({
      search: search || undefined,
      limit,
      offset: page * limit,
    }),
    initialData:
      page === 0 && !search
        ? { users: initialUsers, total: totalUsers }
        : undefined,
  });

  const { data: reportData } = useQuery({
    ...trpc.admin.report.queryOptions(),
    initialData: report,
  });

  const { data: auditData } = useQuery({
    ...trpc.admin.auditEvents.queryOptions({ limit: 12 }),
    initialData: { events: initialAuditEvents, total: auditTotal },
  });

  const users = usersData?.users ?? initialUsers;
  const total = usersData?.total ?? totalUsers;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const effectiveReport = reportData ?? report;
  const effectiveAudit = auditData ?? {
    events: initialAuditEvents,
    total: auditTotal,
  };

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [["admin"]] });
  }, [queryClient]);

  const statItems = [
    {
      label: "Users",
      value: stats.userCount,
      icon: <Users className="size-3.5 text-zinc-500" />,
    },
    {
      label: "Sessions",
      value: stats.sessionCount,
      icon: <Activity className="size-3.5 text-zinc-500" />,
    },
    {
      label: "Organizations",
      value: stats.orgCount,
      icon: <Building2 className="size-3.5 text-zinc-500" />,
    },
    {
      label: "Subscriptions",
      value: stats.subscriptionCount,
      icon: <CreditCard className="size-3.5 text-zinc-500" />,
    },
  ];

  const systemSignals = [
    { label: "Audit events (24h)", value: effectiveReport.auditEvents24h },
    { label: "Login failures (24h)", value: effectiveReport.loginFailures24h },
    { label: "Active subscriptions", value: effectiveReport.activeSubscriptions },
    { label: "Pending webhooks", value: effectiveReport.pendingWebhooks },
    { label: "Dead webhooks", value: effectiveReport.deadWebhooks },
    { label: "Assets", value: effectiveReport.assetCount },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="section-label">Admin</p>
        <h1 className="mt-1 heading-page">System Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.04] sm:grid-cols-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="bg-[#0a0a0c] px-4 py-4">
            <div className="mb-2 flex items-center gap-1.5">
              {stat.icon}
              <span className="text-[11px] text-zinc-500">
                {stat.label}
              </span>
            </div>
            <p className="text-xl font-semibold tabular-nums text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <h3 className="heading-section flex-1">Users</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search users..."
                className="w-64 rounded-md border border-white/[0.06] bg-white/[0.04] py-1.5 pl-9 pr-3 text-[13px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] text-zinc-500">
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Sessions</th>
                  <th className="px-5 py-3 text-left font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onViewDetail={() => setSelectedUser(user.id)}
                    onMutate={invalidate}
                  />
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
              <span className="text-[12px] text-zinc-500">{total} total users</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  disabled={page === 0}
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="px-2 text-[12px] text-zinc-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.min(totalPages - 1, value + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel">
            <div className="panel-header">
              <h2 className="heading-section">System Signals</h2>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                Audit, webhook, and storage activity at a glance.
              </p>
            </div>
            <div className="grid gap-2 p-5 sm:grid-cols-2 xl:grid-cols-1">
              {systemSignals.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
                >
                  <p className="text-[11px] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.06] px-5 py-4">
              <h3 className="text-[12px] text-zinc-500">
                Subscription mix
              </h3>
              <div className="mt-3 space-y-2">
                {effectiveReport.subscriptionBreakdown.length > 0 ? (
                  effectiveReport.subscriptionBreakdown.slice(0, 6).map((item) => (
                    <div
                      key={`${item.plan}-${item.status}`}
                      className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-[12px]"
                    >
                      <span className="text-white">
                        {item.plan} <span className="text-zinc-500">({item.status})</span>
                      </span>
                      <span className="tabular-nums text-zinc-400">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-zinc-500">No subscriptions recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="heading-section">Recent Audit Activity</h2>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {effectiveAudit.total} recorded events. Showing the latest {effectiveAudit.events.length}.
          </p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {effectiveAudit.events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-white/[0.02] lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
                    {formatAction(event.action)}
                  </span>
                  <span className="text-[12px] text-zinc-500">
                    {event.subjectType}:{event.subjectId}
                  </span>
                </div>
                <p className="mt-1 truncate text-[12px] text-zinc-300">
                  {describeAuditMetadata(event.metadata)}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  actor {event.actorId ?? event.actorType} • request {event.requestId ?? "n/a"}
                </p>
              </div>
              <div className="shrink-0 text-[11px] text-zinc-500">
                {formatDate(event.createdAt)}
              </div>
            </div>
          ))}
          {effectiveAudit.events.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-zinc-500">
              No audit events yet.
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
          onMutate={invalidate}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  onViewDetail,
  onMutate,
}: {
  user: UserItem;
  onViewDetail: () => void;
  onMutate: () => void;
}) {
  const trpc = useTRPC();
  const banMutation = useMutation(trpc.admin.banUser.mutationOptions());
  const unbanMutation = useMutation(trpc.admin.unbanUser.mutationOptions());

  const handleToggleBan = async () => {
    if (user.banned) {
      await unbanMutation.mutateAsync({ userId: user.id });
    } else {
      await banMutation.mutateAsync({ userId: user.id });
    }
    onMutate();
  };

  return (
    <tr className="transition-colors hover:bg-white/[0.02]">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="size-7 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-[10px] font-medium uppercase">
                {user.name.slice(0, 2)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-white">{user.name}</p>
            <p className="truncate text-[11px] text-zinc-600">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <span
          className={`rounded-md border px-2 py-0.5 text-[11px] ${user.role === "admin"
            ? "border-white/[0.1] bg-white/[0.06] text-white"
            : "border-white/[0.06] bg-white/[0.04] text-zinc-400"
            }`}
        >
          {user.role ?? "user"}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5">
          <div
            className={`size-1.5 rounded-full ${user.banned
              ? "bg-zinc-400"
              : user.emailVerified
                ? "bg-zinc-400"
                : "bg-zinc-600"
              }`}
          />
          <span className="text-[12px] text-zinc-400">
            {user.banned ? "Banned" : user.emailVerified ? "Active" : "Unverified"}
          </span>
        </div>
      </td>
      <td className="px-5 py-3 tabular-nums text-zinc-400">{user.sessionCount}</td>
      <td className="px-5 py-3 text-[12px] text-zinc-500">
        {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
          new Date(user.createdAt),
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onViewDetail}
            className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-white"
            title="View details"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleBan}
            className={`rounded-md p-1.5 transition-colors ${user.banned
              ? "text-zinc-400 hover:bg-white/[0.04]"
              : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"
              }`}
            title={user.banned ? "Unban" : "Ban"}
          >
            {user.banned ? (
              <ShieldCheck className="size-3.5" />
            ) : (
              <Ban className="size-3.5" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

function UserDetailModal({
  userId,
  onClose,
  onMutate,
}: {
  userId: string;
  onClose: () => void;
  onMutate: () => void;
}) {
  const trpc = useTRPC();
  const userQuery = useQuery(trpc.admin.userDetail.queryOptions({ userId }));
  const user = userQuery.data as UserDetail | null | undefined;
  const revokeMutation = useMutation(trpc.admin.revokeSessions.mutationOptions());

  const handleRevokeSessions = async () => {
    if (!confirm("Revoke all sessions for this user?")) return;
    await revokeMutation.mutateAsync({ userId });
    onMutate();
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative z-10 panel p-8">
          <p className="text-[13px] text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-md border border-white/[0.06] bg-[#111113] p-6 animate-fade-in">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm font-medium uppercase">
                  {user.name.slice(0, 2)}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">{user.name}</h2>
              <p className="font-mono text-[12px] text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Role", value: user.role ?? "user" },
            { label: "Status", value: user.banned ? "Banned" : "Active" },
            { label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
            { label: "Plan", value: user.entitlements.plan },
            { label: "Last Login", value: user.lastLoginMethod ?? "N/A" },
            { label: "Sessions", value: String(user.counts.sessions) },
            { label: "Accounts", value: String(user.counts.accounts) },
            { label: "Passkeys", value: String(user.counts.passkeys) },
          ].map((item) => (
            <div key={item.label}>
              <p className="mb-0.5 text-[10px] text-zinc-600">
                {item.label}
              </p>
              <p className="text-[13px] text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {user.banReason && (
          <div className="mb-4 rounded-md border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="mb-1 text-[11px] text-zinc-500">Ban Reason</p>
            <p className="text-[13px] text-zinc-300">{user.banReason}</p>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] text-zinc-500">
                  Recent Sessions
                </h3>
                <button
                  type="button"
                  onClick={handleRevokeSessions}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-white"
                >
                  <Trash2 className="size-3" />
                  Revoke all
                </button>
              </div>
              <div className="space-y-1">
                {user.sessions.length > 0 ? (
                  user.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-lg bg-white/[0.02] p-2 text-[12px]"
                    >
                      <p className="text-zinc-300">{session.ipAddress ?? "Unknown IP"}</p>
                      <p className="mt-0.5 text-zinc-600">{formatDate(session.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-white/[0.02] p-3 text-[12px] text-zinc-500">
                    No active sessions recorded.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[12px] text-zinc-500">
                Subscriptions
              </h3>
              <div className="space-y-1">
                {user.subscriptions.length > 0 ? (
                  user.subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2 text-[12px]"
                    >
                      <div>
                        <p className="font-medium text-white">{subscription.plan}</p>
                        <p className="text-zinc-600">
                          {subscription.periodStart
                            ? formatDate(subscription.periodStart)
                            : "No billing period"}
                        </p>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${subscription.status === "active"
                          ? "bg-white/[0.06] text-white"
                          : "bg-white/[0.04] text-zinc-500"
                          }`}
                      >
                        {subscription.status ?? "unknown"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-white/[0.02] p-3 text-[12px] text-zinc-500">
                    No subscriptions on record.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="mb-2 text-[12px] text-zinc-500">
                Usage limits
              </h3>
              <div className="space-y-1">
                {Object.entries(user.entitlements.limits).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2 text-[12px]"
                  >
                    <span className="text-zinc-300">{key}</span>
                    <span className="tabular-nums text-white">
                      {value.used} / {value.limit === -1 ? "unlimited" : value.limit}
                    </span>
                  </div>
                ))}
                {Object.keys(user.entitlements.limits).length === 0 && (
                  <div className="rounded-lg bg-white/[0.02] p-3 text-[12px] text-zinc-500">
                    No tracked limits on this plan.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[12px] text-zinc-500">
                Audit Trail
              </h3>
              <div className="space-y-1">
                {user.auditEvents.length > 0 ? (
                  user.auditEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg bg-white/[0.02] p-2 text-[12px]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white">{formatAction(event.action)}</span>
                        <span className="text-zinc-600">{formatDate(event.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-zinc-500">
                        {describeAuditMetadata(event.metadata)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-white/[0.02] p-3 text-[12px] text-zinc-500">
                    No audit events for this user yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
