import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { cacheKeys, getCache } from "@/lib/cache";

/**
 * Auth-related business logic helpers.
 *
 * These extract auth-adjacent data that isn't directly available
 * through the Better Auth client but is useful for dashboard
 * and settings screens.
 */

export interface UserStats {
    sessions: number;
    accounts: number;
    passkeys: number;
}

/**
 * Get aggregated stats for a user: active sessions, linked accounts, passkeys.
 */
export async function getUserStats(
    db: PrismaClient,
    userId: string,
): Promise<UserStats> {
    const cache = await getCache();

    return cache.remember(cacheKeys.userDashboard(userId), 60, async () => {
        const [sessions, accounts, passkeys] = await Promise.all([
            db.session.count({ where: { userId } }),
            db.account.count({ where: { userId } }),
            db.passkey.count({ where: { userId } }),
        ]);

        return { sessions, accounts, passkeys };
    });
}

export interface RecentSession {
    createdAt: string;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * Get recent sessions for a user, ordered by most recent first.
 */
export async function getRecentSessions(
    db: PrismaClient,
    userId: string,
    limit = 30,
): Promise<RecentSession[]> {
    const cache = await getCache();

    return cache.remember(cacheKeys.userRecentSessions(userId), 60, async () => {
        const sessions = await db.session.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: { createdAt: true, userAgent: true, ipAddress: true },
        });

        return sessions.map((s) => ({
            createdAt: s.createdAt.toISOString(),
            userAgent: s.userAgent ?? undefined,
            ipAddress: s.ipAddress ?? undefined,
        }));
    });
}
