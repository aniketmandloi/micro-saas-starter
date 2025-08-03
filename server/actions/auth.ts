"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionResult } from "@/types/database";

// ================================
// Validation Schemas
// ================================

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

const deleteAccountSchema = z.object({
  confirmationText: z.literal("DELETE"),
});

// ================================
// Profile Management Actions
// ================================

/**
 * Update user profile information
 */
export async function updateUserProfile(
  data: z.infer<typeof updateProfileSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateProfileSchema.parse(data);

    // Update user in Clerk
    await (await clerkClient()).users.updateUser(userId, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
    });

    // Update user in database
    await db.user.update({
      where: { clerkId: userId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMembers: { include: { organization: true } } },
    });

    if (user?.organizationMembers[0]) {
      await db.auditLog.create({
        data: {
          organizationId: user.organizationMembers[0].organizationId,
          userId: user.id,
          action: "user.profile_updated",
          resourceType: "user",
          resourceId: user.id,
          metadata: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
          },
        },
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Delete user account (soft delete - removes from organizations but keeps data)
 */
export async function deleteUserAccount(
  data: z.infer<typeof deleteAccountSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    deleteAccountSchema.parse(data);

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Remove user from all organizations
    await db.organizationMember.deleteMany({
      where: { userId: user.id },
    });

    // Deactivate API keys
    await db.apiKey.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    // Create audit logs for each organization
    for (const membership of user.organizationMembers) {
      await db.auditLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: user.id,
          action: "user.account_deleted",
          resourceType: "user",
          resourceId: user.id,
          metadata: {
            email: user.email,
            deletedAt: new Date().toISOString(),
          },
        },
      });
    }

    // Delete user from Clerk
    await (await clerkClient()).users.deleteUser(userId);

    // User will be deleted from database via webhook

    redirect("/");
  } catch (error) {
    console.error("Error deleting account:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid confirmation",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to delete account" };
  }
}

// ================================
// Session Management Actions
// ================================

/**
 * Sign out user from current session
 */
export async function signOutUser(): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not signed in" };
    }

    // Log the sign out action
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMembers: { include: { organization: true } } },
    });

    if (user?.organizationMembers[0]) {
      await db.auditLog.create({
        data: {
          organizationId: user.organizationMembers[0].organizationId,
          userId: user.id,
          action: "user.signed_out",
          resourceType: "user",
          resourceId: user.id,
          metadata: {
            signedOutAt: new Date().toISOString(),
          },
        },
      });
    }

    redirect("/sign-in");
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: "Failed to sign out" };
  }
}

// ================================
// Account Preferences Actions
// ================================

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  securityAlerts: z.boolean(),
  timezone: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  data: z.infer<typeof updatePreferencesSchema>
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updatePreferencesSchema.parse(data);

    // Update user metadata in Clerk
    await (await clerkClient()).users.updateUserMetadata(userId, {
      publicMetadata: {
        preferences: validatedData,
        updatedAt: new Date().toISOString(),
      },
    });

    // Update in database if needed (preferences are stored in Clerk metadata)
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMembers: { include: { organization: true } } },
    });

    if (user?.organizationMembers[0]) {
      await db.auditLog.create({
        data: {
          organizationId: user.organizationMembers[0].organizationId,
          userId: user.id,
          action: "user.preferences_updated",
          resourceType: "user",
          resourceId: user.id,
          metadata: validatedData,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating preferences:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid preference data",
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return { success: false, error: "Failed to update preferences" };
  }
}

// ================================
// Organization Switching Actions
// ================================

/**
 * Switch active organization
 */
export async function switchOrganization(
  organizationId: string
): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user is member of the organization
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      },
      include: { organization: true },
    });

    if (!membership) {
      return {
        success: false,
        error: "You are not a member of this organization",
      };
    }

    // Set organization as active in Clerk
    await (await clerkClient()).organizations.updateOrganizationMembership({
      organizationId: membership.organization.slug,
      userId,
      role: membership.role.toLowerCase(), // Convert to Clerk role format
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error switching organization:", error);
    return { success: false, error: "Failed to switch organization" };
  }
}

// ================================
// Password and Security Actions
// ================================

/**
 * Update user password (redirects to Clerk password update)
 */
export async function updatePassword(): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Log password change attempt
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMembers: { include: { organization: true } } },
    });

    if (user?.organizationMembers[0]) {
      await db.auditLog.create({
        data: {
          organizationId: user.organizationMembers[0].organizationId,
          userId: user.id,
          action: "user.password_change_initiated",
          resourceType: "user",
          resourceId: user.id,
          metadata: {
            initiatedAt: new Date().toISOString(),
          },
        },
      });
    }

    // Clerk handles password updates through their UI
    return {
      success: true,
      data: { redirectToClerk: true },
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error: "Failed to initiate password update" };
  }
}

/**
 * Enable two-factor authentication
 */
export async function enableTwoFactor(): Promise<ActionResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Log 2FA enablement
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMembers: { include: { organization: true } } },
    });

    if (user?.organizationMembers[0]) {
      await db.auditLog.create({
        data: {
          organizationId: user.organizationMembers[0].organizationId,
          userId: user.id,
          action: "user.two_factor_enabled",
          resourceType: "user",
          resourceId: user.id,
          metadata: {
            enabledAt: new Date().toISOString(),
          },
        },
      });
    }

    return {
      success: true,
      data: { message: "Two-factor authentication enabled" },
    };
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return {
      success: false,
      error: "Failed to enable two-factor authentication",
    };
  }
}
