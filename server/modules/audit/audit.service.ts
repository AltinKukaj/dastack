import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

export interface AuditInput {
  actorId?: string | null;
  actorType?: "user" | "system" | "webhook";
  subjectType: string;
  subjectId: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Write an audit event to the database.
 */
export async function logAuditEvent(db: PrismaClient, input: AuditInput) {
  return db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? "user",
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      action: input.action,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      requestId: input.requestId,
    },
  });
}

export interface AuditQueryOptions {
  actorId?: string;
  subjectId?: string;
  subjectType?: string;
  action?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query audit events with optional filters.
 */
export async function queryAuditEvents(
  db: PrismaClient,
  opts: AuditQueryOptions,
) {
  const where: Record<string, unknown> = {};

  if (opts.actorId) where.actorId = opts.actorId;
  if (opts.subjectId) where.subjectId = opts.subjectId;
  if (opts.subjectType) where.subjectType = opts.subjectType;
  if (opts.action) where.action = opts.action;
  if (opts.from || opts.to) {
    where.createdAt = {
      ...(opts.from ? { gte: opts.from } : {}),
      ...(opts.to ? { lte: opts.to } : {}),
    };
  }

  const [events, total] = await Promise.all([
    db.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
    }),
    db.auditEvent.count({ where }),
  ]);

  return {
    events: events.map((e) => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
      createdAt: e.createdAt.toISOString(),
    })),
    total,
  };
}

/**
 * Predefined audit action constants.
 */
export const AuditActions = {
  PASSWORD_CHANGED: "password.changed",
  EMAIL_CHANGED: "email.changed",
  TWO_FACTOR_ENABLED: "2fa.enabled",
  TWO_FACTOR_DISABLED: "2fa.disabled",
  PASSKEY_ADDED: "passkey.added",
  PASSKEY_REMOVED: "passkey.removed",
  SESSION_REVOKED: "session.revoked",
  SUBSCRIPTION_CHANGED: "subscription.changed",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  ADMIN_ACTION: "admin.action",
  ORG_CREATED: "org.created",
  ORG_MEMBER_INVITED: "org.member.invited",
  ORG_MEMBER_REMOVED: "org.member.removed",
  ORG_MEMBER_ROLE_CHANGED: "org.member.role_changed",
  ACCOUNT_DELETED: "account.deleted",
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILED: "auth.login.failed",
} as const;
