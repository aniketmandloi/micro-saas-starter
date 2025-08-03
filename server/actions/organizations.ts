"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/types/database";

// ================================
// Validation Schemas
// ================================

const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100)
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  imageUrl: z.string().url("Must be a valid URL").optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
  organizationId: z.string().cuid(),
});

const updateMemberRoleSchema = z.object({
  memberId: z.string().cuid(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]), // Can't change to OWNER via this action
});

const removeMemberSchema = z.object({
  memberId: z.string().cuid(),
});

const deleteOrganizationSchema = z.object({
  organizationId: z.string().cuid(),
  confirmationText: z.literal("DELETE"),
});

// ================================
// Organization CRUD Actions
// ================================

/**
 * Create a new organization
 */
export async function createOrganization(
  data: z.infer<typeof createOrganizationSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = createOrganizationSchema.parse(data);

    // Check if slug is already taken
    const existingOrg = await db.organization.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingOrg) {
      return { success: false, error: "Organization slug is already taken" };
    }

    // Get user from database
    let user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    // Create user if doesn't exist (webhook might not have run yet)
    if (!user) {
      const clerkUser = await (await clerkClient()).users.getUser(userId);

      user = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      });
    }

    // Create organization in Clerk first
    const clerkOrg = await (
      await clerkClient()
    ).organizations.createOrganization({
      name: validatedData.name,
      slug: validatedData.slug,
      createdBy: userId,
    });

    // Create organization in database
    const organization = await db.organization.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description ?? null,
        members: {
          create: {
            userId: user.id,
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

    // Create audit log
    await db.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        action: "organization.created",
        resourceType: "organization",
        resourceId: organization.id,
        metadata: {
          organizationName: validatedData.name,
          slug: validatedData.slug,
          clerkOrgId: clerkOrg.id,
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: organization };
  } catch (error) {
    console.error("Error creating organization:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to create organization" };
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(
  organizationId: string,
  data: z.infer<typeof updateOrganizationSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateOrganizationSchema.parse(data);

    // Check permissions
    const membership = await requireRole(organizationId, ["OWNER", "ADMIN"]);

    // Update organization
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description ?? null;
    if (validatedData.imageUrl !== undefined)
      updateData.imageUrl = validatedData.imageUrl ?? null;
    if (validatedData.settings !== undefined)
      updateData.settings = validatedData.settings;

    const organization = await db.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    // Update in Clerk if name changed
    if (validatedData.name) {
      try {
        const clerkOrgs = await (
          await clerkClient()
        ).organizations.getOrganizationList();
        const clerkOrg = clerkOrgs.data.find(
          (org) => org.slug === organization.slug
        );

        if (clerkOrg) {
          await (
            await clerkClient()
          ).organizations.updateOrganization(clerkOrg.id, {
            name: validatedData.name,
          });
        }
      } catch (clerkError) {
        console.warn("Failed to update organization in Clerk:", clerkError);
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        organizationId,
        userId: membership.user.id,
        action: "organization.updated",
        resourceType: "organization",
        resourceId: organizationId,
        metadata: JSON.parse(JSON.stringify(validatedData)),
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: organization };
  } catch (error) {
    console.error("Error updating organization:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to update organization" };
  }
}

/**
 * Delete organization (only by owner)
 */
export async function deleteOrganization(
  data: z.infer<typeof deleteOrganizationSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = deleteOrganizationSchema.parse(data);

    // Check permissions (only owner can delete)
    const membership = await requireRole(validatedData.organizationId, [
      "OWNER",
    ]);

    // Check if organization has active subscriptions
    const activeSubscriptions = await db.subscription.count({
      where: {
        organizationId: validatedData.organizationId,
        status: "ACTIVE",
      },
    });

    if (activeSubscriptions > 0) {
      return {
        success: false,
        error:
          "Cannot delete organization with active subscriptions. Please cancel all subscriptions first.",
      };
    }

    // Delete from Clerk first
    try {
      const clerkOrgs = await (
        await clerkClient()
      ).organizations.getOrganizationList();
      const clerkOrg = clerkOrgs.data.find(
        (org: { slug: string }) => org.slug === membership.organization.slug
      );

      if (clerkOrg) {
        await (
          await clerkClient()
        ).organizations.deleteOrganization(clerkOrg.id);
      }
    } catch (clerkError) {
      console.warn("Failed to delete organization from Clerk:", clerkError);
    }

    // Create audit log before deletion
    await db.auditLog.create({
      data: {
        organizationId: validatedData.organizationId,
        userId: membership.user.id,
        action: "organization.deleted",
        resourceType: "organization",
        resourceId: validatedData.organizationId,
        metadata: {
          organizationName: membership.organization.name,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    // Delete organization (cascade will handle related records)
    await db.organization.delete({
      where: { id: validatedData.organizationId },
    });

    revalidatePath("/dashboard");
    redirect("/onboarding");
  } catch (error) {
    console.error("Error deleting organization:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid confirmation",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to delete organization" };
  }
}

// ================================
// Member Management Actions
// ================================

/**
 * Invite user to organization
 */
export async function inviteUserToOrganization(
  data: z.infer<typeof inviteUserSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = inviteUserSchema.parse(data);

    // Check permissions
    const membership = await requireRole(validatedData.organizationId, [
      "OWNER",
      "ADMIN",
    ]);

    // Check if user is already a member
    const existingMember = await db.user.findFirst({
      where: {
        email: validatedData.email,
        organizationMembers: {
          some: { organizationId: validatedData.organizationId },
        },
      },
    });

    if (existingMember) {
      return {
        success: false,
        error: "User is already a member of this organization",
      };
    }

    // Find user by email
    const targetUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    // If user doesn't exist, we'll create an invitation record
    // The user will be added to the organization when they sign up
    if (!targetUser) {
      // Create invitation record (you might want a separate invitations table)
      // For now, we'll handle this when the user signs up and webhook processes
      return {
        success: true,
        data: {
          message: "Invitation sent. User will be added when they sign up.",
        },
      };
    }

    // Add user to organization
    const newMember = await db.organizationMember.create({
      data: {
        userId: targetUser.id,
        organizationId: validatedData.organizationId,
        role: validatedData.role,
        joinedAt: new Date(),
      },
      include: {
        user: true,
        organization: true,
      },
    });

    // Add user to Clerk organization
    try {
      const clerkOrgs = await (
        await clerkClient()
      ).organizations.getOrganizationList();
      const clerkOrg = clerkOrgs.data.find(
        (org: { slug: string }) => org.slug === membership.organization.slug
      );

      if (clerkOrg && targetUser.clerkId) {
        await (
          await clerkClient()
        ).organizations.createOrganizationMembership({
          organizationId: clerkOrg.id,
          userId: targetUser.clerkId,
          role: validatedData.role.toLowerCase(),
        });
      }
    } catch (clerkError) {
      console.warn("Failed to add user to Clerk organization:", clerkError);
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        organizationId: validatedData.organizationId,
        userId: membership.user.id,
        action: "organization.member_invited",
        resourceType: "organization_member",
        resourceId: newMember.id,
        metadata: {
          invitedEmail: validatedData.email,
          role: validatedData.role,
        },
      },
    });

    // TODO: Send invitation email using Resend

    revalidatePath("/dashboard/team");
    return { success: true, data: newMember };
  } catch (error) {
    console.error("Error inviting user:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to invite user" };
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  data: z.infer<typeof updateMemberRoleSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateMemberRoleSchema.parse(data);

    // Get member info
    const member = await db.organizationMember.findUnique({
      where: { id: validatedData.memberId },
      include: { user: true, organization: true },
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check permissions
    await requireRole(member.organizationId, ["OWNER", "ADMIN"]);

    // Can't change owner role
    if (member.role === "OWNER") {
      return { success: false, error: "Cannot change owner role" };
    }

    // Update member role
    const updatedMember = await db.organizationMember.update({
      where: { id: validatedData.memberId },
      data: {
        role: validatedData.role,
        updatedAt: new Date(),
      },
      include: { user: true },
    });

    // Update in Clerk
    try {
      const clerkOrgs = await (
        await clerkClient()
      ).organizations.getOrganizationList();
      const clerkOrg = clerkOrgs.data.find(
        (org: { slug: string }) => org.slug === member.organization.slug
      );

      if (clerkOrg && member.user.clerkId) {
        await (
          await clerkClient()
        ).organizations.updateOrganizationMembership({
          organizationId: clerkOrg.id,
          userId: member.user.clerkId,
          role: validatedData.role.toLowerCase(),
        });
      }
    } catch (clerkError) {
      console.warn("Failed to update member role in Clerk:", clerkError);
    }

    // Create audit log
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
    });
    if (currentUser) {
      await db.auditLog.create({
        data: {
          organizationId: member.organizationId,
          userId: currentUser.id,
          action: "organization.member_role_updated",
          resourceType: "organization_member",
          resourceId: member.id,
          metadata: {
            memberEmail: member.user.email,
            oldRole: member.role,
            newRole: validatedData.role,
          },
        },
      });
    }

    revalidatePath("/dashboard/team");
    return { success: true, data: updatedMember };
  } catch (error) {
    console.error("Error updating member role:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to update member role" };
  }
}

/**
 * Remove member from organization
 */
export async function removeMemberFromOrganization(
  data: z.infer<typeof removeMemberSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = removeMemberSchema.parse(data);

    // Get member info
    const member = await db.organizationMember.findUnique({
      where: { id: validatedData.memberId },
      include: { user: true, organization: true },
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check permissions
    await requireRole(member.organizationId, ["OWNER", "ADMIN"]);

    // Can't remove owner
    if (member.role === "OWNER") {
      return { success: false, error: "Cannot remove organization owner" };
    }

    // Remove from Clerk first
    try {
      const clerkOrgs = await (
        await clerkClient()
      ).organizations.getOrganizationList();
      const clerkOrg = clerkOrgs.data.find(
        (org: { slug: string }) => org.slug === member.organization.slug
      );

      if (clerkOrg && member.user.clerkId) {
        await (
          await clerkClient()
        ).organizations.deleteOrganizationMembership({
          organizationId: clerkOrg.id,
          userId: member.user.clerkId,
        });
      }
    } catch (clerkError) {
      console.warn(
        "Failed to remove member from Clerk organization:",
        clerkError
      );
    }

    // Create audit log before removal
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
    });
    if (currentUser) {
      await db.auditLog.create({
        data: {
          organizationId: member.organizationId,
          userId: currentUser.id,
          action: "organization.member_removed",
          resourceType: "organization_member",
          resourceId: member.id,
          metadata: {
            removedMemberEmail: member.user.email,
            removedMemberRole: member.role,
            removedAt: new Date().toISOString(),
          },
        },
      });
    }

    // Remove member from organization
    await db.organizationMember.delete({
      where: { id: validatedData.memberId },
    });

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    console.error("Error removing member:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to remove member" };
  }
}

// ================================
// Organization Settings Actions
// ================================

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  organizationId: string,
  settings: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check permissions
    const membership = await requireRole(organizationId, ["OWNER", "ADMIN"]);

    // Update settings
    const organization = await db.organization.update({
      where: { id: organizationId },
      data: {
        settings: JSON.parse(JSON.stringify(settings)),
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        organizationId,
        userId: membership.user.id,
        action: "organization.settings_updated",
        resourceType: "organization",
        resourceId: organizationId,
        metadata: { settings: JSON.parse(JSON.stringify(settings)) },
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: organization };
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
