import "server-only";

/**
 * Billing webhooks service.
 *
 * Processes incoming Stripe and Polar webhook events. Each event is
 * stored for auditing, de-duplicated via cache + DB uniqueness,
 * and triggers entitlement refresh + cache invalidation for the
 * affected user or organization.
 */

import type Stripe from "stripe";
import { createLogger } from "@/lib/logger";
import { cacheKeys, getCache } from "@/lib/cache";
import { db } from "@/server/db/prisma";
import {
  ingestWebhook,
  markWebhookFailed,
  markWebhookProcessed,
} from "@/server/jobs/webhook-processor";
import {
  AuditActions,
  logAuditEvent,
} from "@/server/modules/audit/audit.service";
import {
  invalidateSubjectCaches,
  invalidateSystemCaches,
} from "@/server/modules/cache/cache-invalidation.service";
import {
  getEntitlements,
  refreshEntitlements,
} from "@/server/modules/entitlements/entitlements.service";

type BillingProvider = "stripe";

const logger = createLogger("billing-webhooks");

const STRIPE_RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getStringField(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  return getString(value[key]);
}

function getNestedString(value: unknown, ...keys: string[]): string | null {
  let current: unknown = value;

  for (const key of keys) {
    if (!isRecord(current)) return null;
    current = current[key];
  }

  return getString(current);
}

function isRelevantEvent(provider: BillingProvider, eventType: string): boolean {
  return provider === "stripe" && STRIPE_RELEVANT_EVENTS.has(eventType);
}

function subscriptionAuditAction(eventType: string) {
  return eventType.includes("deleted") ||
    eventType.includes("canceled") ||
    eventType.includes("revoked")
    ? AuditActions.SUBSCRIPTION_CANCELLED
    : AuditActions.SUBSCRIPTION_CHANGED;
}

async function resolveStripeSubject(event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;
  const subscriptionId =
    object.object === "subscription"
      ? getStringField(object, "id")
      : getStringField(object, "subscription");
  const referenceId =
    getStringField(object, "client_reference_id") ??
    getNestedString(object, "metadata", "referenceId");
  const customerId =
    getStringField(object, "customer") ??
    getNestedString(object, "customer", "id");

  const candidates: Array<
    | { stripeSubscriptionId: string }
    | { id: string }
    | { referenceId: string }
  > = [];
  if (subscriptionId) {
    candidates.push({ stripeSubscriptionId: subscriptionId });
    candidates.push({ id: subscriptionId });
  }
  if (referenceId) {
    candidates.push({ referenceId });
  }

  const subscription =
    candidates.length > 0
      ? await db.subscription.findFirst({
        where: { OR: candidates },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          plan: true,
          userId: true,
          stripeSubscriptionId: true,
        },
      })
      : null;

  if (subscription?.userId) {
    return {
      subjectId: subscription.userId,
      subjectType: "user" as const,
      subscriptionId: subscription.id,
      providerSubscriptionId:
        subscription.stripeSubscriptionId ?? subscriptionId ?? null,
      plan: subscription.plan,
    };
  }

  if (customerId) {
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });

    if (user) {
      return {
        subjectId: user.id,
        subjectType: "user" as const,
        subscriptionId: subscription?.id ?? null,
        providerSubscriptionId: subscriptionId ?? null,
        plan: subscription?.plan ?? null,
      };
    }
  }

  if (referenceId) {
    const user = await db.user.findUnique({
      where: { id: referenceId },
      select: { id: true },
    });

    if (user) {
      return {
        subjectId: user.id,
        subjectType: "user" as const,
        subscriptionId: subscription?.id ?? null,
        providerSubscriptionId: subscriptionId ?? null,
        plan: subscription?.plan ?? null,
      };
    }

    const organization = await db.organization.findUnique({
      where: { id: referenceId },
      select: { id: true },
    });

    if (organization) {
      return {
        subjectId: organization.id,
        subjectType: "organization" as const,
        subscriptionId: subscription?.id ?? null,
        providerSubscriptionId: subscriptionId ?? null,
        plan: subscription?.plan ?? null,
      };
    }
  }

  return null;
}

async function refreshSubjectEntitlements(
  subjectId: string,
  subjectType: "user" | "organization",
) {
  try {
    return await refreshEntitlements(db, subjectId, subjectType);
  } catch (error) {
    logger.warn(
      {
        err: error,
        subjectId,
        subjectType,
      },
      "entitlement refresh failed, falling back to current snapshot",
    );
    return getEntitlements(db, subjectId, subjectType);
  }
}

async function findStoredWebhookEvent(
  provider: BillingProvider,
  providerEventId: string,
) {
  return db.webhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider,
        providerEventId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });
}

async function processStoredBillingWebhook(webhookEventId: string) {
  const event = await db.webhookEvent.findUnique({
    where: { id: webhookEventId },
  });

  if (!event || event.status === "completed") return;

  const payload = JSON.parse(event.payload) as Stripe.Event;
  const subject = await resolveStripeSubject(payload);

  if (!subject) {
    logger.warn(
      {
        webhookEventId,
        provider: event.provider,
        eventType: event.eventType,
      },
      "billing webhook processed without a resolved subject",
    );
    await markWebhookProcessed(webhookEventId);
    return;
  }

  const snapshot = await refreshSubjectEntitlements(
    subject.subjectId,
    subject.subjectType,
  );

  const cache = await getCache();

  await Promise.all([
    invalidateSubjectCaches(subject.subjectId, subject.subjectType),
    invalidateSystemCaches(),
    cache.del(cacheKeys.webhookIdempotency(event.providerEventId)),
    logAuditEvent(db, {
      actorId: null,
      actorType: "webhook",
      subjectType: subject.subjectType,
      subjectId: subject.subjectId,
      action: subscriptionAuditAction(event.eventType),
      metadata: {
        provider: event.provider,
        providerEventId: event.providerEventId,
        providerSubscriptionId: subject.providerSubscriptionId ?? null,
        eventType: event.eventType,
        plan: subject.plan ?? snapshot.plan,
        snapshotPlan: snapshot.plan,
        webhookEventId,
      },
      requestId: webhookEventId,
    }),
  ]);

  await markWebhookProcessed(webhookEventId);
}

/**
 * Process billing webhooks inline so the starter only needs a single web
 * process. The stored webhook_event row remains available for audit/debugging.
 */
async function processBillingWebhookEvent(
  provider: BillingProvider,
  providerEventId: string,
  eventType: string,
  payload: unknown,
) {
  if (!isRelevantEvent(provider, eventType)) {
    return { processed: false, duplicate: false };
  }

  const cache = await getCache();
  const markerKey = cacheKeys.webhookIdempotency(providerEventId);
  const cachedMarker = await cache.get<boolean>(markerKey);

  if (cachedMarker) {
    return { processed: false, duplicate: true };
  }

  const existingEvent = await findStoredWebhookEvent(provider, providerEventId);

  if (existingEvent?.status === "completed") {
    await cache.set(markerKey, true, 60 * 60 * 24);
    return { processed: false, duplicate: true };
  }

  const webhookEventId =
    existingEvent?.id ??
    (
      await ingestWebhook(provider, providerEventId, eventType, payload)
    ).id;

  try {
    await processStoredBillingWebhook(webhookEventId);
  } catch (error) {
    await markWebhookFailed(
      webhookEventId,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }

  await cache.set(markerKey, true, 60 * 60 * 24);

  logger.info(
    {
      provider,
      providerEventId,
      eventType,
      webhookEventId,
    },
    "processed billing webhook",
  );

  return { processed: true, duplicate: Boolean(existingEvent) };
}

/**
 * Process a verified Stripe webhook event.
 *
 * Only relevant event types (checkout, subscription CRUD) are
 * processed; all others are silently skipped.
 */
export async function handleStripeBillingWebhook(event: Stripe.Event) {
  return processBillingWebhookEvent("stripe", event.id, event.type, event);
}


