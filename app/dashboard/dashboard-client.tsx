/** Dashboard client — tabbed UI (Overview, Analytics, Activity) with Recharts visualizations. */
"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Activity,
    ArrowUpRight,
    BarChart3,
    CreditCard,
    Fingerprint,
    Globe,
    KeyRound,
    LayoutDashboard,
    Monitor,
    Settings,
    Shield,
    ShieldCheck,
    Smartphone,
    TrendingUp,
    Users,
    Clock,
    ChevronRight,
    Check,
} from "lucide-react";
import {
    generateActivityData,
    getDeviceBreakdown,
    getSecurityScore,
    type ActivityPoint,
    type DeviceBreakdownItem,
} from "./dashboard-insights";

interface DashboardClientProps {
    firstName: string;
    user: {
        name: string;
        email: string;
        emailVerified: boolean;
        twoFactorEnabled: boolean;
        image?: string;
        createdAt?: string;
    };
    stats: {
        sessions: number;
        accounts: number;
        passkeys: number;
    };
    recentSessions: Array<{
        createdAt: string;
        userAgent?: string;
        ipAddress?: string;
    }>;
    paymentsEnabled: boolean;
}

type Tab = "overview" | "analytics" | "activity";

function ChartTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border border-white/[0.08] bg-[#111113] px-3 py-2">
            <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
            {payload.map((entry) => (
                <p key={entry.name} className="text-[12px] text-white flex items-center gap-2">
                    <span
                        className="size-1.5 rounded-full"
                        style={{ background: entry.color }}
                    />
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
}

export function DashboardClient({
    firstName,
    user,
    stats,
    recentSessions,
    paymentsEnabled,
}: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const activityData = useMemo(() => generateActivityData(recentSessions), [recentSessions]);
    const deviceData = useMemo(() => getDeviceBreakdown(recentSessions), [recentSessions]);
    const securityScore = useMemo(
        () =>
            getSecurityScore(
                user.emailVerified,
                user.twoFactorEnabled,
                stats.passkeys,
                stats.accounts
            ),
        [user.emailVerified, user.twoFactorEnabled, stats.passkeys, stats.accounts]
    );

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Overview", icon: <LayoutDashboard className="size-3.5" /> },
        { id: "analytics", label: "Analytics", icon: <BarChart3 className="size-3.5" /> },
        { id: "activity", label: "Activity", icon: <Activity className="size-3.5" /> },
    ];

    const memberSince = user.createdAt
        ? new Intl.DateTimeFormat(undefined, {
            month: "short",
            year: "numeric",
        }).format(new Date(user.createdAt))
        : "Recently";

    const handleTabChange = useCallback((id: Tab) => setActiveTab(id), []);

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="heading-page">
                        Welcome back, {firstName}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="size-3 text-zinc-600" />
                    <span className="text-[11px] text-zinc-600">
                        Member since {memberSince}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`tab-item ${activeTab === tab.id ? "tab-active" : "tab-inactive"}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div key={activeTab} className="animate-fade-in">
                {activeTab === "overview" && (
                    <OverviewTab
                        user={user}
                        stats={stats}
                        securityScore={securityScore}
                        paymentsEnabled={paymentsEnabled}
                        activityData={activityData}
                    />
                )}
                {activeTab === "analytics" && (
                    <AnalyticsTab
                        activityData={activityData}
                        deviceData={deviceData}
                        stats={stats}
                    />
                )}
                {activeTab === "activity" && (
                    <ActivityTab recentSessions={recentSessions} />
                )}
            </div>
        </div>
    );
}

/* ─── Overview Tab ─── */

function OverviewTab({
    user,
    stats,
    securityScore,
    paymentsEnabled,
    activityData,
}: {
    user: DashboardClientProps["user"];
    stats: DashboardClientProps["stats"];
    securityScore: number;
    paymentsEnabled: boolean;
    activityData: ActivityPoint[];
}) {
    const quickActions = [
        {
            icon: <Settings className="size-4" />,
            label: "Account settings",
            href: "/dashboard/settings",
        },
        {
            icon: <ShieldCheck className="size-4" />,
            label: "Security",
            href: "/dashboard/settings/security",
        },
        ...(paymentsEnabled
            ? [
                {
                    icon: <CreditCard className="size-4" />,
                    label: "Billing",
                    href: "/dashboard/billing",
                },
            ]
            : []),
        {
            icon: <KeyRound className="size-4" />,
            label: "Passkeys",
            href: "/dashboard/settings/passkeys",
        },
    ];

    const setupItems = [
        { label: "Email verified", done: user.emailVerified },
        { label: "Two-factor auth", done: user.twoFactorEnabled },
        { label: "Passkey added", done: stats.passkeys > 0 },
        { label: "Social account linked", done: stats.accounts > 1 },
    ];
    const completedCount = setupItems.filter((s) => s.done).length;

    return (
        <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-md overflow-hidden border border-white/[0.06]">
                {[
                    { label: "Sessions", value: stats.sessions, icon: <Monitor className="size-3.5 text-zinc-500" /> },
                    { label: "Linked Accounts", value: stats.accounts, icon: <Users className="size-3.5 text-zinc-500" /> },
                    { label: "Passkeys", value: stats.passkeys, icon: <Fingerprint className="size-3.5 text-zinc-500" /> },
                    { label: "Security", value: `${securityScore}%`, icon: <Shield className="size-3.5 text-zinc-500" /> },
                ].map((stat) => (
                    <div key={stat.label} className="bg-[#0a0a0c] px-4 py-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            {stat.icon}
                            <span className="text-[11px] text-zinc-500">{stat.label}</span>
                        </div>
                        <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
                {/* Activity chart — takes 3 cols */}
                <div className="lg:col-span-3 panel p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="heading-section">Activity</h3>
                            <p className="caption">Last 7 days</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <TrendingUp className="size-3" />
                            <span className="text-[11px]">Active</span>
                        </div>
                    </div>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={activityData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.04)"
                                />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#52525b" }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#52525b" }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="sessions"
                                    stroke="#a1a1aa"
                                    strokeWidth={1.5}
                                    fillOpacity={0.08}
                                    fill="#a1a1aa"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Security checklist — takes 2 cols */}
                <div className="lg:col-span-2 panel p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="heading-section">Security</h3>
                        <span className="text-sm font-semibold tabular-nums text-white">
                            {securityScore}%
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1 rounded-full bg-white/[0.06] mb-5">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out bg-white"
                            style={{ width: `${securityScore}%` }}
                        />
                    </div>
                    <div className="space-y-3 flex-1">
                        {setupItems.map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div
                                    className={`flex size-5 shrink-0 items-center justify-center rounded-full transition-colors ${item.done
                                        ? "bg-white/10 text-white"
                                        : "border border-white/[0.08] text-transparent"
                                        }`}
                                >
                                    {item.done && <Check className="size-3" strokeWidth={2.5} />}
                                </div>
                                <span
                                    className={`text-[13px] ${item.done
                                        ? "text-zinc-500"
                                        : "text-zinc-300"
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-[11px] text-zinc-600">
                        {completedCount}/{setupItems.length} completed
                    </p>
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="group flex items-center gap-3 panel panel-hover px-4 py-3.5"
                    >
                        <div className="flex size-8 items-center justify-center rounded-md bg-white/[0.04] text-zinc-500 group-hover:text-white transition-colors duration-150">
                            {action.icon}
                        </div>
                        <span className="text-[13px] font-medium text-zinc-400 group-hover:text-white transition-colors duration-150">
                            {action.label}
                        </span>
                        <ArrowUpRight className="size-3.5 text-zinc-800 group-hover:text-zinc-500 transition-colors duration-150 ml-auto" />
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ─── Analytics Tab ─── */

function AnalyticsTab({
    activityData,
    deviceData,
    stats,
}: {
    activityData: ActivityPoint[];
    deviceData: DeviceBreakdownItem[];
    stats: DashboardClientProps["stats"];
}) {
    const totalSessions = activityData.reduce((sum, d) => sum + d.sessions, 0);
    const activeDays = activityData.filter((point) => point.sessions > 0).length;
    const avgSessionsPerDay = totalSessions > 0 ? (totalSessions / 7).toFixed(1) : "0";

    return (
        <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-md overflow-hidden border border-white/[0.06]">
                {[
                    { label: "Sessions (7d)", value: totalSessions },
                    { label: "Active Days", value: activeDays },
                    { label: "Avg / Day", value: avgSessionsPerDay },
                    { label: "Security Methods", value: stats.passkeys + stats.accounts },
                ].map((stat) => (
                    <div key={stat.label} className="bg-[#0a0a0c] px-4 py-4">
                        <p className="text-[11px] text-zinc-500 mb-1">{stat.label}</p>
                        <p className="text-xl font-semibold text-white tabular-nums tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                {/* Bar chart */}
                <div className="lg:col-span-2 panel p-5">
                    <div className="mb-4">
                        <h3 className="heading-section">Sessions</h3>
                        <p className="caption">Daily session creation for the last 7 days</p>
                    </div>
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={activityData} barGap={4}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.04)"
                                />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#52525b" }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#52525b" }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar
                                    dataKey="sessions"
                                    fill="#a1a1aa"
                                    radius={[3, 3, 0, 0]}
                                    maxBarSize={28}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device breakdown */}
                <div className="panel p-5">
                    <h3 className="heading-section mb-4">Devices</h3>
                    {deviceData.length > 0 ? (
                        <>
                            <div className="flex items-center justify-center">
                                <div className="h-[150px] w-[150px]">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <PieChart>
                                            <Pie
                                                data={deviceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={46}
                                                outerRadius={66}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {deviceData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2.5">
                                {deviceData.map((device) => (
                                    <div
                                        key={device.name}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-2 text-[12px] text-zinc-400">
                                            <span
                                                className="size-2 rounded-full"
                                                style={{ background: device.color }}
                                            />
                                            {device.name === "Desktop" && <Monitor className="size-3" />}
                                            {device.name === "Mobile" && <Smartphone className="size-3" />}
                                            {device.name === "Other" && <Globe className="size-3" />}
                                            {device.name}
                                        </span>
                                        <span className="text-[12px] text-white tabular-nums">
                                            {device.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center text-[12px] text-zinc-500">
                            No recent device data available yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Activity Tab ─── */

function ActivityTab({
    recentSessions,
}: {
    recentSessions: DashboardClientProps["recentSessions"];
}) {
    const formatDate = (value: string) => {
        const date = new Date(value);
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    };

    const getDeviceIcon = (ua?: string) => {
        if (!ua) return <Globe className="size-4" />;
        const lower = ua.toLowerCase();
        if (
            lower.includes("mobile") ||
            lower.includes("android") ||
            lower.includes("iphone")
        ) {
            return <Smartphone className="size-4" />;
        }
        return <Monitor className="size-4" />;
    };

    const getDeviceName = (ua?: string) => {
        if (!ua) return "Unknown device";
        if (ua.includes("Windows")) return "Windows";
        if (ua.includes("Mac")) return "macOS";
        if (ua.includes("iPhone")) return "iPhone";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("Linux")) return "Linux";
        return "Browser";
    };

    const getBrowserName = (ua?: string) => {
        if (!ua) return "";
        if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
        if (ua.includes("Edg")) return "Edge";
        return "";
    };

    // Group sessions by date
    const groupedSessions = useMemo(() => {
        const groups: Record<string, typeof recentSessions> = {};
        for (const session of recentSessions) {
            const dateKey = new Date(session.createdAt).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(session);
        }
        return Object.entries(groups);
    }, [recentSessions]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="heading-section">Recent Activity</h3>
                    <p className="caption">
                        Your last {recentSessions.length} session
                        {recentSessions.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link
                    href="/dashboard/settings/sessions"
                    className="link-subtle flex items-center gap-1"
                >
                    Manage sessions
                    <ChevronRight className="size-3" />
                </Link>
            </div>

            {recentSessions.length > 0 ? (
                <div className="space-y-4">
                    {groupedSessions.map(([dateLabel, sessions]) => (
                        <div key={dateLabel}>
                            <p className="text-[11px] font-medium text-zinc-500 mb-2 px-1">
                                {dateLabel}
                            </p>
                            <div className="panel overflow-hidden divide-y divide-white/[0.06]">
                                {sessions.map((session, i) => (
                                    <div
                                        key={`${session.createdAt}-${i}`}
                                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors duration-150"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-500">
                                            {getDeviceIcon(session.userAgent)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] text-white">
                                                    {getDeviceName(session.userAgent)}
                                                </p>
                                                {getBrowserName(session.userAgent) && (
                                                    <span className="text-[11px] text-zinc-600">
                                                        {getBrowserName(session.userAgent)}
                                                    </span>
                                                )}
                                                {i === 0 && dateLabel === groupedSessions[0]?.[0] && (
                                                    <span className="flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-0.5 text-[10px] text-zinc-400">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="caption mt-0.5">
                                                {session.ipAddress ?? "Unknown IP"} ·{" "}
                                                {formatDate(session.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="panel p-8 text-center">
                    <Activity className="mx-auto size-6 text-zinc-600" />
                    <p className="mt-3 text-[13px] text-zinc-500">
                        No recent activity found
                    </p>
                </div>
            )}
        </div>
    );
}
