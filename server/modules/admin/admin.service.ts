import "server-only";

/**
 * Admin service module.
 *
 * Provides server-side helpers for user management and system
 * statistics used exclusively by the admin panel.
 */

import { type PrismaClient, Prisma } from "@/generated/prisma/client";
import { queryAuditEvents } from "@/server/modules/audit/audit.service";
import { getEntitlements } from "@/server/modules/entitlements/entitlements.service";

export interface UserListItem {
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

/**
 * List users with optional search, pagination, and session counts.
 */
export async function listUsers(
  db: PrismaClient,
  opts: { search?: string; limit?: number; offset?: number } = {},
) {
  const where: Prisma.UserWhereInput = {};

  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
    }),
    db.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      role: u.role,
      banned: u.banned,
      image: u.image,
      createdAt: u.createdAt.toISOString(),
      lastLoginMethod: u.lastLoginMethod,
      sessionCount: u._count.sessions,
    })),
    total,
  };
}

/**
 * Get a detailed profile for a single user including sessions,
 * linked accounts, subscriptions, entitlements, and recent audit events.
 */
export async function getUserDetail(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
        },
      },
      accounts: {
        select: { id: true, providerId: true, createdAt: true },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { sessions: true, accounts: true, passkeys: true } },
    },
  });

  if (!user) return null;

  const [entitlements, audit] = await Promise.all([
    getEntitlements(db, userId),
    queryAuditEvents(db, {
      subjectId: userId,
      subjectType: "user",
      limit: 10,
    }),
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    banned: user.banned,
    banReason: user.banReason,
    banExpires: user.banExpires?.toISOString() ?? null,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    lastLoginMethod: user.lastLoginMethod,
    counts: user._count,
    sessions: user.sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    })),
    accounts: user.accounts.map((a) => ({
      id: a.id,
      providerId: a.providerId,
      createdAt: a.createdAt.toISOString(),
    })),
    subscriptions: user.subscriptions.map((s) => ({
      id: s.id,
      plan: s.plan,
      status: s.status,
      periodStart: s.periodStart?.toISOString() ?? null,
      periodEnd: s.periodEnd?.toISOString() ?? null,
    })),
    entitlements,
    auditEvents: audit.events,
  };
}

/**
 * Ban a user, optionally with a reason and expiration date.
 */
export async function banUser(
  db: PrismaClient,
  userId: string,
  reason?: string,
  expiresAt?: Date,
) {
  return db.user.update({
    where: { id: userId },
    data: { banned: true, banReason: reason ?? null, banExpires: expiresAt ?? null },
  });
}

/**
 * Remove a ban from a user, clearing the reason and expiry.
 */
export async function unbanUser(db: PrismaClient, userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { banned: false, banReason: null, banExpires: null },
  });
}

/**
 * Revoke (delete) all active sessions for a user.
 */
export async function revokeUserSessions(db: PrismaClient, userId: string) {
  return db.session.deleteMany({ where: { userId } });
}

/**
 * Get high-level system statistics: user, session, org, and subscription counts.
 */
export async function getSystemStats(db: PrismaClient) {
  const [userCount, sessionCount, orgCount, subscriptionCount] =
    await Promise.all([
      db.user.count(),
      db.session.count(),
      db.organization.count().catch(() => 0),
      db.subscription.count(),
    ]);

  return { userCount, sessionCount, orgCount, subscriptionCount };
}
