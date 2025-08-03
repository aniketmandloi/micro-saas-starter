import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"

const createOrganizationSchema = z.object({
  clerkId: z.string(),
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { clerkId, name, slug, description } = createOrganizationSchema.parse(body)

    // Check if user exists in database
    let user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    // Create user if doesn't exist (webhook might not have run yet)
    if (!user) {
      // Get user from Clerk for basic info
      const { clerkClient } = await import("@clerk/nextjs/server")
      const clerkUser = await clerkClient.users.getUser(userId)
      
      user = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        }
      })
    }

    // Create organization in database
    const organization = await db.organization.create({
      data: {
        name,
        slug,
        description,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            joinedAt: new Date(),
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        action: "organization.created",
        resourceType: "organization",
        resourceId: organization.id,
        metadata: {
          organizationName: name,
          slug,
        }
      }
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Error creating organization:", error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    return new NextResponse("Internal Server Error", { status: 500 })
  }
}