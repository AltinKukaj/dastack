import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { cacheKeys, getCache } from "@/lib/cache";

/**
 * Organization service module.
 *
 * Provides server-side helpers for querying organization data
 * that goes beyond what the Better Auth organization plugin
 * exposes through its API.
 */

export interface OrgSummary {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    memberCount: number;
    createdAt: string;
}

/**
 * Get all organizations the user is a member of, with member counts.
 */
export async function getUserOrganizations(
    db: PrismaClient,
    userId: string,
): Promise<OrgSummary[]> {
    const memberships = await db.member.findMany({
        where: { userId },
        include: {
            organization: {
                include: {
                    _count: { select: { members: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        logo: m.organization.logo,
        memberCount: m.organization._count.members,
        createdAt: m.organization.createdAt.toISOString(),
    }));
}

export interface OrgMemberInfo {
    id: string;
    userId: string;
    role: string;
    userName: string;
    userEmail: string;
    userImage: string | null;
    joinedAt: string;
}

interface OrgMembershipSnapshot {
  members: OrgMemberInfo[];
  invitations: OrgInvitationInfo[];
}

async function buildOrgMembershipSnapshot(
  db: PrismaClient,
  organizationId: string,
): Promise<OrgMembershipSnapshot> {
  const [members, invitations] = await Promise.all([
    db.member.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId, status: "pending" },
      include: {
        inviter: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      userName: m.user.name,
      userEmail: m.user.email,
      userImage: m.user.image,
      joinedAt: m.createdAt.toISOString(),
    })),
    invitations: invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      inviterName: inv.inviter.name,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
    })),
  };
}

async function getOrgMembershipSnapshot(
  db: PrismaClient,
  organizationId: string,
): Promise<OrgMembershipSnapshot> {
  const cache = await getCache();
  return cache.remember(cacheKeys.orgMembership(organizationId), 90, () =>
    buildOrgMembershipSnapshot(db, organizationId),
  );
}

/**
 * Get all members of an organization with user details.
 */
export async function getOrgMembers(
  db: PrismaClient,
  organizationId: string,
): Promise<OrgMemberInfo[]> {
  const snapshot = await getOrgMembershipSnapshot(db, organizationId);
  return snapshot.members;
}

export interface OrgInvitationInfo {
    id: string;
    email: string;
    role: string | null;
    status: string;
    inviterName: string;
    createdAt: string;
    expiresAt: string;
}

/**
 * Get pending invitations for an organization.
 */
export async function getOrgInvitations(
  db: PrismaClient,
  organizationId: string,
): Promise<OrgInvitationInfo[]> {
  const snapshot = await getOrgMembershipSnapshot(db, organizationId);
  return snapshot.invitations;
}

/**
 * Get the user's role in a specific organization.
 */
export async function getUserOrgRole(
  db: PrismaClient,
  userId: string,
  organizationId: string,
): Promise<string | null> {
  const snapshot = await getOrgMembershipSnapshot(db, organizationId);
  return snapshot.members.find((member) => member.userId === userId)?.role ?? null;
}
