import { z } from "zod";
import { router, adminProcedure } from "@/server/api/trpc";
import {
  listUsers,
  getUserDetail,
  banUser,
  unbanUser,
  revokeUserSessions,
  getSystemStats,
} from "@/server/modules/admin/admin.service";
import {
  AuditActions,
  logAuditEvent,
  queryAuditEvents,
} from "@/server/modules/audit/audit.service";
import {
  invalidateSystemCaches,
  invalidateUserCaches,
} from "@/server/modules/cache/cache-invalidation.service";
import { getSystemReport } from "@/server/modules/analytics/analytics.service";

/**
 * Admin router — user management, audit log, and system stats.
 *
 * All procedures require admin role authentication via `adminProcedure`.
 * Mutations automatically log audit events and invalidate relevant caches.
 */
export const adminRouter = router({
  stats: adminProcedure.query(async ({ ctx }) => {
    return getSystemStats(ctx.db);
  }),

  report: adminProcedure.query(async ({ ctx }) => {
    return getSystemReport(ctx.db);
  }),

  users: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listUsers(ctx.db, input);
    }),

  userDetail: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return getUserDetail(ctx.db, input.userId);
    }),

  auditEvents: adminProcedure
    .input(
      z
        .object({
          actorId: z.string().optional(),
          subjectId: z.string().optional(),
          subjectType: z.string().optional(),
          action: z.string().optional(),
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return queryAuditEvents(ctx.db, {
        actorId: input?.actorId,
        subjectId: input?.subjectId,
        subjectType: input?.subjectType,
        action: input?.action,
        limit: input?.limit,
        offset: input?.offset,
      });
    }),

  banUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().optional(),
        expiresAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await banUser(ctx.db, input.userId, input.reason, input.expiresAt);
      await Promise.all([
        invalidateUserCaches(input.userId),
        invalidateSystemCaches(),
        logAuditEvent(ctx.db, {
          actorId: ctx.session.user.id,
          subjectType: "user",
          subjectId: input.userId,
          action: AuditActions.ADMIN_ACTION,
          metadata: {
            operation: "ban_user",
            reason: input.reason ?? null,
            expiresAt: input.expiresAt?.toISOString() ?? null,
          },
          ipAddress: ctx.ipAddress ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
          requestId: ctx.requestId,
        }),
      ]);
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await unbanUser(ctx.db, input.userId);
      await Promise.all([
        invalidateUserCaches(input.userId),
        invalidateSystemCaches(),
        logAuditEvent(ctx.db, {
          actorId: ctx.session.user.id,
          subjectType: "user",
          subjectId: input.userId,
          action: AuditActions.ADMIN_ACTION,
          metadata: {
            operation: "unban_user",
          },
          ipAddress: ctx.ipAddress ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
          requestId: ctx.requestId,
        }),
      ]);
      return { success: true };
    }),

  revokeSessions: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await revokeUserSessions(ctx.db, input.userId);
      await Promise.all([
        invalidateUserCaches(input.userId),
        invalidateSystemCaches(),
        logAuditEvent(ctx.db, {
          actorId: ctx.session.user.id,
          subjectType: "user",
          subjectId: input.userId,
          action: AuditActions.SESSION_REVOKED,
          metadata: {
            source: "admin",
          },
          ipAddress: ctx.ipAddress ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
          requestId: ctx.requestId,
        }),
      ]);
      return { success: true };
    }),
});
