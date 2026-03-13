import { router, protectedProcedure } from "@/server/api/trpc";
import { getUserStats, getRecentSessions } from "@/server/modules/auth/auth.service";

/**
 * Auth router - exposes auth-adjacent read helpers for the dashboard.
 */
export const authRouter = router({
    stats: protectedProcedure.query(async ({ ctx }) => {
        return getUserStats(ctx.db, ctx.session.user.id);
    }),

    recentSessions: protectedProcedure.query(async ({ ctx }) => {
        return getRecentSessions(ctx.db, ctx.session.user.id);
    }),
});
