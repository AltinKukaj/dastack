import "server-only";

import { db } from "@/server/db/prisma";

/**
 * Ingest a webhook event. Returns the event ID and whether it was a duplicate.
 */
export async function ingestWebhook(
  provider: string,
  providerEventId: string,
  eventType: string,
  payload: unknown,
): Promise<{ id: string; duplicate: boolean }> {
  const existing = await db.webhookEvent.findUnique({
    where: { provider_providerEventId: { provider, providerEventId } },
  });

  if (existing) {
    return { id: existing.id, duplicate: true };
  }

  const event = await db.webhookEvent.create({
    data: {
      provider,
      providerEventId,
      eventType,
      payload: JSON.stringify(payload),
      status: "pending",
    },
  });

  return { id: event.id, duplicate: false };
}

/**
 * Mark a webhook event as successfully processed.
 */
export async function markWebhookProcessed(eventId: string) {
  await db.webhookEvent.update({
    where: { id: eventId },
    data: { status: "completed", processedAt: new Date() },
  });
}

/**
 * Mark a webhook event as failed. Moves to dead after 3 attempts.
 */
export async function markWebhookFailed(eventId: string, error: string) {
  const event = await db.webhookEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const newAttempts = event.attempts + 1;
  await db.webhookEvent.update({
    where: { id: eventId },
    data: {
      status: newAttempts >= 3 ? "dead" : "pending",
      attempts: newAttempts,
      lastError: error,
    },
  });
}

