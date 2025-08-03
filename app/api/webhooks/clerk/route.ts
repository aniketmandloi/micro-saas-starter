import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { db } from "@/lib/db"
import type { ClerkWebhookEvent } from "@/types/auth"

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "")

  let evt: ClerkWebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new NextResponse("Error occured", {
      status: 400,
    })
  }

  // Handle the webhook event
  try {
    switch (evt.type) {
      case "user.created":
        await handleUserCreated(evt.data)
        break
      case "user.updated":
        await handleUserUpdated(evt.data)
        break
      case "user.deleted":
        await handleUserDeleted(evt.data)
        break
      case "organization.created":
        await handleOrganizationCreated(evt.data)
        break
      case "organization.updated":
        await handleOrganizationUpdated(evt.data)
        break
      case "organization.deleted":
        await handleOrganizationDeleted(evt.data)
        break
      case "organizationMembership.created":
        await handleMembershipCreated(evt.data)
        break
      case "organizationMembership.updated":
        await handleMembershipUpdated(evt.data)
        break
      case "organizationMembership.deleted":
        await handleMembershipDeleted(evt.data)
        break
      default:
        console.log(`Unhandled webhook event type: ${evt.type}`)
    }

    return new NextResponse("Webhook processed successfully", { status: 200 })
  } catch (error) {
    console.error(`Error processing webhook ${evt.type}:`, error)
    return new NextResponse("Error processing webhook", { status: 500 })
  }
}

// ================================
// User Event Handlers
// ================================

async function handleUserCreated(data: any) {
  console.log("User created:", data.id)

  try {
    await db.user.create({
      data: {
        clerkId: data.id,
        email: data.email_addresses[0]?.email_address || "",
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
      },
    })
    console.log(`Database user created for Clerk user ${data.id}`)
  } catch (error) {
    // User might already exist, which is fine
    console.log(`User ${data.id} already exists in database or creation failed:`, error)
  }
}

async function handleUserUpdated(data: any) {
  console.log("User updated:", data.id)

  try {
    await db.user.update({
      where: { clerkId: data.id },
      data: {
        email: data.email_addresses[0]?.email_address || "",
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
        updatedAt: new Date(),
      },
    })
    console.log(`Database user updated for Clerk user ${data.id}`)
  } catch (error) {
    console.error(`Failed to update user ${data.id}:`, error)
  }
}

async function handleUserDeleted(data: any) {
  console.log("User deleted:", data.id)

  try {
    await db.user.delete({
      where: { clerkId: data.id },
    })
    console.log(`Database user deleted for Clerk user ${data.id}`)
  } catch (error) {
    console.error(`Failed to delete user ${data.id}:`, error)
  }
}

// ================================
// Organization Event Handlers
// ================================

async function handleOrganizationCreated(data: any) {
  console.log("Organization created:", data.id)

  try {
    // Note: We typically create organizations via API when user creates them
    // This webhook is mainly for backup/sync purposes
    await db.organization.upsert({
      where: { slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-') },
      update: {
        name: data.name,
        imageUrl: data.image_url,
        updatedAt: new Date(),
      },
      create: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        imageUrl: data.image_url,
      },
    })
    console.log(`Database organization synced for Clerk org ${data.id}`)
  } catch (error) {
    console.error(`Failed to sync organization ${data.id}:`, error)
  }
}

async function handleOrganizationUpdated(data: any) {
  console.log("Organization updated:", data.id)

  try {
    await db.organization.updateMany({
      where: { 
        OR: [
          { slug: data.slug },
          { name: data.name }
        ]
      },
      data: {
        name: data.name,
        imageUrl: data.image_url,
        updatedAt: new Date(),
      },
    })
    console.log(`Database organization updated for Clerk org ${data.id}`)
  } catch (error) {
    console.error(`Failed to update organization ${data.id}:`, error)
  }
}

async function handleOrganizationDeleted(data: any) {
  console.log("Organization deleted:", data.id)

  try {
    // Find organization by slug or name since we don't store Clerk ID
    const org = await db.organization.findFirst({
      where: {
        OR: [
          { slug: data.slug },
          { name: data.name }
        ]
      }
    })

    if (org) {
      await db.organization.delete({
        where: { id: org.id },
      })
      console.log(`Database organization deleted for Clerk org ${data.id}`)
    }
  } catch (error) {
    console.error(`Failed to delete organization ${data.id}:`, error)
  }
}

// ================================
// Membership Event Handlers
// ================================

async function handleMembershipCreated(data: any) {
  console.log("Membership created:", data)

  try {
    // Find the user and organization
    const user = await db.user.findUnique({
      where: { clerkId: data.public_user_data.user_id },
    })

    const organization = await db.organization.findFirst({
      where: {
        OR: [
          { slug: data.organization.slug },
          { name: data.organization.name }
        ]
      }
    })

    if (user && organization) {
      // Map Clerk role to our database role
      const role = mapClerkRoleToDbRole(data.role)

      await db.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          }
        },
        update: {
          role,
          joinedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          organizationId: organization.id,
          role,
          joinedAt: new Date(),
        },
      })
      console.log(`Membership created for user ${user.id} in org ${organization.id}`)
    }
  } catch (error) {
    console.error("Failed to create membership:", error)
  }
}

async function handleMembershipUpdated(data: any) {
  console.log("Membership updated:", data)

  try {
    const user = await db.user.findUnique({
      where: { clerkId: data.public_user_data.user_id },
    })

    const organization = await db.organization.findFirst({
      where: {
        OR: [
          { slug: data.organization.slug },
          { name: data.organization.name }
        ]
      }
    })

    if (user && organization) {
      const role = mapClerkRoleToDbRole(data.role)

      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          }
        },
        data: {
          role,
          updatedAt: new Date(),
        },
      })
      console.log(`Membership updated for user ${user.id} in org ${organization.id}`)
    }
  } catch (error) {
    console.error("Failed to update membership:", error)
  }
}

async function handleMembershipDeleted(data: any) {
  console.log("Membership deleted:", data)

  try {
    const user = await db.user.findUnique({
      where: { clerkId: data.public_user_data.user_id },
    })

    const organization = await db.organization.findFirst({
      where: {
        OR: [
          { slug: data.organization.slug },
          { name: data.organization.name }
        ]
      }
    })

    if (user && organization) {
      await db.organizationMember.delete({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          }
        },
      })
      console.log(`Membership deleted for user ${user.id} in org ${organization.id}`)
    }
  } catch (error) {
    console.error("Failed to delete membership:", error)
  }
}

// ================================
// Helper Functions
// ================================

function mapClerkRoleToDbRole(clerkRole: string) {
  switch (clerkRole) {
    case "org:admin":
      return "ADMIN"
    case "org:member":
      return "MEMBER"
    default:
      return "MEMBER"
  }
}