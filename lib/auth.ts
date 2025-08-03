import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type {
  AuthUser,
  AuthOrganization,
  OrganizationRole,
  Permission,
} from "@/types/auth";
import { ROLE_PERMISSIONS } from "@/types/auth";

// ================================
// Core Authentication Functions
// ================================

/**
 * Get current user session from Clerk
 */
export async function getCurrentSession() {
  return auth();
}

/**
 * Require authentication - redirect to sign-in if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

/**
 * Require organization context - redirect if no active organization
 */
export async function requireOrganization() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/dashboard/organizations");
  }

  return { userId, orgId };
}

/**
 * Get current user with database sync
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId, orgId } = await auth();

  if (!userId) return null;

  try {
    // Get Clerk user
    const clerkUser = await (await clerkClient()).users.getUser(userId);

    // Get or create database user
    let dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          include: {
            organization: true,
          },
        },
      },
    });

    // Create user if doesn't exist (first time login)
    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
        include: {
          organizationMembers: {
            include: {
              organization: true,
            },
          },
        },
      });
    }

    // Get user's organizations from Clerk
    const clerkOrganizations = await (
      await clerkClient()
    ).users.getOrganizationMembershipList({
      userId,
    });

    // Build organizations array
    const organizations: AuthOrganization[] = [];
    for (const membership of clerkOrganizations.data) {
      const orgMember = dbUser.organizationMembers.find(
        (m) => m.organization.slug === membership.organization.slug
      );

      if (orgMember) {
        organizations.push({
          id: orgMember.organization.id,
          clerkId: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug ?? "",
          description: orgMember.organization.description ?? "",
          imageUrl: membership.organization.imageUrl,
          role: orgMember.role,
          clerkOrganization: membership.organization,
        });
      }
    }

    const activeOrganization = organizations.find(
      (org) => org.clerkId === orgId
    );

    return {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      clerkUser,
      organizations,
      ...(dbUser.firstName && { firstName: dbUser.firstName }),
      ...(dbUser.lastName && { lastName: dbUser.lastName }),
      ...(dbUser.imageUrl && { imageUrl: dbUser.imageUrl }),
      ...(activeOrganization && { activeOrganization }),
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get current organization with user role
 */
export async function getCurrentOrganization(): Promise<AuthOrganization | null> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) return null;

  try {
    // Get organization from Clerk
    const clerkOrg = await (
      await clerkClient()
    ).organizations.getOrganization({
      organizationId: orgId,
    });

    // Get organization from database
    const dbOrg = await db.organization.findFirst({
      where: {
        OR: [
          { slug: clerkOrg.slug },
          // Fallback for organizations created before slug implementation
          { name: clerkOrg.name },
        ],
      },
      include: {
        members: {
          where: {
            user: { clerkId: userId },
          },
        },
      },
    });

    if (!dbOrg || !dbOrg.members[0]) return null;

    return {
      id: dbOrg.id,
      clerkId: orgId,
      name: clerkOrg.name,
      slug: clerkOrg.slug ?? dbOrg.slug,
      description: dbOrg.description ?? "",
      imageUrl: clerkOrg.imageUrl,
      role: dbOrg.members[0].role,
      clerkOrganization: clerkOrg,
    };
  } catch (error) {
    console.error("Error getting current organization:", error);
    return null;
  }
}

// ================================
// Permission & Role Management
// ================================

/**
 * Check if user has specific permission in organization
 */
export async function hasPermission(
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) return false;

  try {
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      },
    });

    if (!membership) return false;

    const rolePermissions = ROLE_PERMISSIONS[membership.role];
    return rolePermissions.includes(permission);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Require specific permission - throw error if not authorized
 */
export async function requirePermission(
  organizationId: string,
  permission: Permission
) {
  const hasAccess = await hasPermission(organizationId, permission);

  if (!hasAccess) {
    throw new Error(`Insufficient permissions: ${permission}`);
  }
}

/**
 * Require specific role - throw error if not authorized
 */
export async function requireRole(
  organizationId: string,
  allowedRoles: OrganizationRole[]
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const membership = await db.organizationMember.findFirst({
    where: {
      user: { clerkId: userId },
      organizationId,
      role: { in: allowedRoles },
    },
    include: {
      user: true,
      organization: true,
    },
  });

  if (!membership) {
    throw new Error("Insufficient role permissions");
  }

  return membership;
}

/**
 * Check if user is organization owner
 */
export async function isOrganizationOwner(
  organizationId: string
): Promise<boolean> {
  return hasPermission(organizationId, "organization:delete");
}

/**
 * Check if user can manage organization members
 */
export async function canManageMembers(
  organizationId: string
): Promise<boolean> {
  return hasPermission(organizationId, "organization:members:write");
}

// ================================
// Organization Management
// ================================

/**
 * Create organization in both Clerk and database
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Create organization in Clerk
    const clerkOrg = await (
      await clerkClient()
    ).organizations.createOrganization({
      name: data.name,
      slug: data.slug,
      createdBy: userId,
    });

    // Create organization in database
    const dbOrg = await db.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        members: {
          create: {
            user: {
              connect: { clerkId: userId },
            },
            role: "OWNER",
            joinedAt: new Date(),
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    return {
      clerkOrganization: clerkOrg,
      dbOrganization: dbOrg,
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    throw new Error("Failed to create organization");
  }
}

/**
 * Sync organization data between Clerk and database
 */
export async function syncOrganization(clerkOrgId: string) {
  try {
    const clerkOrg = await (
      await clerkClient()
    ).organizations.getOrganization({
      organizationId: clerkOrgId,
    });

    // Update or create organization in database
    await db.organization.upsert({
      where: { slug: clerkOrg.slug || clerkOrg.name },
      update: {
        name: clerkOrg.name,
        imageUrl: clerkOrg.imageUrl,
        updatedAt: new Date(),
      },
      create: {
        name: clerkOrg.name,
        slug: clerkOrg.slug || clerkOrg.name.toLowerCase().replace(/\s+/g, "-"),
        imageUrl: clerkOrg.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error syncing organization:", error);
  }
}

// ================================
// API Key Authentication
// ================================

/**
 * Authenticate API request using API key
 */
export async function authenticateApiKey(apiKey: string) {
  try {
    // Hash the provided key to match stored hash
    const crypto = await import("crypto");
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const dbApiKey = await db.apiKey.findUnique({
      where: { keyHash },
      include: {
        organization: true,
        user: true,
      },
    });

    if (!dbApiKey || !dbApiKey.isActive) {
      return null;
    }

    // Check if key is expired
    if (dbApiKey.expiresAt && dbApiKey.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp
    await db.apiKey.update({
      where: { id: dbApiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return dbApiKey;
  } catch (error) {
    console.error("Error authenticating API key:", error);
    return null;
  }
}

// ================================
// Utility Functions
// ================================

/**
 * Get user's role in organization
 */
export async function getUserRole(
  organizationId: string,
  userId?: string
): Promise<OrganizationRole | null> {
  const currentUserId = userId || (await auth()).userId;

  if (!currentUserId) return null;

  try {
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: currentUserId },
        organizationId,
      },
    });

    return membership?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Check if user is member of organization
 */
export async function isMemberOfOrganization(
  organizationId: string,
  userId?: string
): Promise<boolean> {
  const role = await getUserRole(organizationId, userId);
  return role !== null;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  return db.organization.findUnique({
    where: { slug },
    include: {
      members: {
        include: { user: true },
      },
      subscriptions: true,
      _count: {
        select: {
          members: true,
          apiKeys: true,
          monitors: true,
        },
      },
    },
  });
}
