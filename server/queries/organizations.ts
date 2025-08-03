"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import type { 
  OrganizationWithMembers,
  UserWithOrganizations 
} from "@/types/database"

// ================================
// Organization Detail Queries
// ================================

/**
 * Get organization by ID with member details
 */
export async function getOrganizationById(organizationId: string): Promise<OrganizationWithMembers | null> {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    // Verify user is member of the organization
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      }
    })

    if (!membership) return null

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: true
          },
          orderBy: [
            { role: 'asc' }, // Owners first
            { joinedAt: 'asc' }
          ]
        },
        _count: {
          select: {
            apiKeys: true,
            monitors: true,
            subscriptions: true,
            auditLogs: true,
          }
        }
      }
    })

    return organization
  } catch (error) {
    console.error("Error fetching organization:", error)
    return null
  }
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<OrganizationWithMembers | null> {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    // First get the organization
    const organization = await db.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!organization) return null

    // Verify user is member of the organization
    const userMembership = organization.members.find(
      member => member.user.clerkId === userId
    )

    if (!userMembership) return null

    // Get full organization details with counts
    const fullOrganization = await db.organization.findUnique({
      where: { id: organization.id },
      include: {
        members: {
          include: {
            user: true
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' }
          ]
        },
        _count: {
          select: {
            apiKeys: true,
            monitors: true,
            subscriptions: true,
            auditLogs: true,
          }
        }
      }
    })

    return fullOrganization
  } catch (error) {
    console.error("Error fetching organization by slug:", error)
    return null
  }
}

/**
 * Get current user's active organization
 */
export async function getCurrentOrganization(): Promise<OrganizationWithMembers | null> {
  try {
    const { userId, orgSlug } = auth()
    
    if (!userId) return null

    // If user has an active organization context, use that
    if (orgSlug) {
      return await getOrganizationBySlug(orgSlug)
    }

    // Otherwise get the first organization user belongs to
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          include: {
            organization: {
              include: {
                members: {
                  include: {
                    user: true
                  }
                },
                _count: {
                  select: {
                    apiKeys: true,
                    monitors: true,
                    subscriptions: true,
                    auditLogs: true,
                  }
                }
              }
            }
          },
          orderBy: [
            { role: 'asc' }, // Prefer owner organizations
            { joinedAt: 'asc' }
          ],
          take: 1
        }
      }
    })

    return user?.organizationMembers[0]?.organization || null
  } catch (error) {
    console.error("Error fetching current organization:", error)
    return null
  }
}

// ================================
// Organization Member Queries
// ================================

/**
 * Get organization members with user details
 */
export async function getOrganizationMembers(organizationId: string) {
  try {
    const { userId } = auth()
    
    if (!userId) return []

    // Verify user is member of the organization
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      }
    })

    if (!membership) return []

    const members = await db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          include: {
            _count: {
              select: {
                apiKeys: true,
                auditLogs: true,
              }
            }
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // Owners first
        { joinedAt: 'asc' }
      ]
    })

    return members
  } catch (error) {
    console.error("Error fetching organization members:", error)
    return []
  }
}

/**
 * Get organization member by user ID
 */
export async function getOrganizationMember(organizationId: string, userId: string) {
  try {
    const { userId: currentUserId } = auth()
    
    if (!currentUserId) return null

    // Verify current user is member of the organization
    const currentMembership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: currentUserId },
        organizationId,
      }
    })

    if (!currentMembership) return null

    const member = await db.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
      include: {
        user: {
          include: {
            apiKeys: {
              select: {
                id: true,
                name: true,
                isActive: true,
                lastUsedAt: true,
                createdAt: true,
              }
            },
            auditLogs: {
              where: { organizationId },
              orderBy: { createdAt: 'desc' },
              take: 10,
            }
          }
        },
        organization: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    })

    return member
  } catch (error) {
    console.error("Error fetching organization member:", error)
    return null
  }
}

// ================================
// Organization Activity Queries
// ================================

/**
 * Get organization activity/audit logs
 */
export async function getOrganizationActivity(organizationId: string, limit: number = 50) {
  try {
    const { userId } = auth()
    
    if (!userId) return []

    // Verify user is member of the organization
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      }
    })

    if (!membership) return []

    const activities = await db.auditLog.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return activities
  } catch (error) {
    console.error("Error fetching organization activity:", error)
    return []
  }
}

/**
 * Get organization usage statistics
 */
export async function getOrganizationStats(organizationId: string) {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    // Verify user is member of the organization
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      }
    })

    if (!membership) return null

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalMembers,
      newMembersThisMonth,
      totalApiKeys,
      activeApiKeys,
      totalMonitors,
      recentActivity,
      activeSubscription
    ] = await Promise.all([
      // Total members
      db.organizationMember.count({
        where: { organizationId }
      }),

      // New members this month
      db.organizationMember.count({
        where: { 
          organizationId,
          joinedAt: { gte: thirtyDaysAgo }
        }
      }),

      // Total API keys
      db.apiKey.count({
        where: { organizationId }
      }),

      // Active API keys
      db.apiKey.count({
        where: { 
          organizationId,
          isActive: true 
        }
      }),

      // Total monitors
      db.monitor.count({
        where: { organizationId }
      }),

      // Recent activity count
      db.auditLog.count({
        where: { 
          organizationId,
          createdAt: { gte: sevenDaysAgo }
        }
      }),

      // Active subscription
      db.subscription.findFirst({
        where: { 
          organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          plan: true,
          status: true,
          currentPeriodEnd: true,
        }
      })
    ])

    return {
      totalMembers,
      newMembersThisMonth,
      totalApiKeys,
      activeApiKeys,
      totalMonitors,
      recentActivity,
      activeSubscription,
    }
  } catch (error) {
    console.error("Error fetching organization stats:", error)
    return null
  }
}

// ================================
// Organization Search and Admin Queries
// ================================

/**
 * Search organizations (for admin/owners)
 */
export async function searchOrganizations(query: string, limit: number = 10) {
  try {
    const { userId } = auth()
    
    if (!userId) return []

    // Verify user has admin access
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          where: { role: { in: ["OWNER", "ADMIN"] } }
        }
      }
    })

    if (!currentUser?.organizationMembers.length) {
      throw new Error("Insufficient permissions")
    }

    const organizations = await db.organization.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: {
        _count: {
          select: {
            members: true,
            apiKeys: true,
            monitors: true,
            subscriptions: true,
          }
        }
      },
      take: limit,
    })

    return organizations
  } catch (error) {
    console.error("Error searching organizations:", error)
    return []
  }
}

/**
 * Get all organizations with pagination (super admin only)
 */
export async function getAllOrganizations(page: number = 1, limit: number = 20) {
  try {
    const { userId } = auth()
    
    if (!userId) return { organizations: [], total: 0, totalPages: 0 }

    // Verify super admin permissions (only owners can see all organizations)
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          where: { role: "OWNER" }
        }
      }
    })

    if (!currentUser?.organizationMembers.length) {
      throw new Error("Insufficient permissions")
    }

    const offset = (page - 1) * limit

    const [organizations, total] = await Promise.all([
      db.organization.findMany({
        include: {
          _count: {
            select: {
              members: true,
              apiKeys: true,
              monitors: true,
              subscriptions: true,
            }
          },
          members: {
            where: { role: "OWNER" },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                }
              }
            },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.organization.count()
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      organizations,
      total,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error("Error fetching all organizations:", error)
    return { organizations: [], total: 0, totalPages: 0, currentPage: 1 }
  }
}

// ================================
// Organization Settings Queries
// ================================

/**
 * Get organization settings
 */
export async function getOrganizationSettings(organizationId: string) {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    // Verify user has admin access to the organization
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
        role: { in: ["OWNER", "ADMIN"] }
      }
    })

    if (!membership) return null

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return organization
  } catch (error) {
    console.error("Error fetching organization settings:", error)
    return null
  }
}

/**
 * Get organization subscription details
 */
export async function getOrganizationSubscription(organizationId: string) {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    // Verify user is member of the organization
    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      }
    })

    if (!membership) return null

    const subscription = await db.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return subscription
  } catch (error) {
    console.error("Error fetching organization subscription:", error)
    return null
  }
}