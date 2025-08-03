"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import type { 
  UserWithOrganizations,
  OrganizationWithMembers 
} from "@/types/database"

// ================================
// User Profile Queries
// ================================

/**
 * Get current user profile with organizations
 */
export async function getCurrentUserProfile(): Promise<UserWithOrganizations | null> {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          include: {
            organization: {
              include: {
                _count: {
                  select: {
                    members: true,
                    apiKeys: true,
                    monitors: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

/**
 * Get user by ID (for admin purposes)
 */
export async function getUserById(userId: string) {
  try {
    const { userId: currentUserId } = auth()
    
    if (!currentUserId) return null

    // Check if current user has admin access to query other users
    const currentUser = await db.user.findUnique({
      where: { clerkId: currentUserId },
      include: {
        organizationMembers: {
          where: { role: { in: ["OWNER", "ADMIN"] } },
          include: { organization: true }
        }
      }
    })

    if (!currentUser?.organizationMembers.length) {
      throw new Error("Insufficient permissions")
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        organizationMembers: {
          include: {
            organization: true
          }
        },
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
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            organization: {
              select: { name: true }
            }
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    return null
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    // Verify current user has permission to query by email
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

    const user = await db.user.findUnique({
      where: { email },
      include: {
        organizationMembers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

// ================================
// User Activity Queries
// ================================

/**
 * Get user's recent activity across all organizations
 */
export async function getUserActivity(limit: number = 20) {
  try {
    const { userId } = auth()
    
    if (!userId) return []

    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) return []

    const activities = await db.auditLog.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return activities
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return []
  }
}

/**
 * Get user's API key usage statistics
 */
export async function getUserApiKeyStats() {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) return null

    const [totalKeys, activeKeys, recentUsage] = await Promise.all([
      // Total API keys
      db.apiKey.count({
        where: { userId: user.id }
      }),

      // Active API keys
      db.apiKey.count({
        where: { 
          userId: user.id,
          isActive: true 
        }
      }),

      // Recent API key usage
      db.apiKey.findMany({
        where: { 
          userId: user.id,
          lastUsedAt: {
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          lastUsedAt: true,
          organization: {
            select: { name: true }
          }
        },
        orderBy: { lastUsedAt: 'desc' },
        take: 5,
      })
    ])

    return {
      totalKeys,
      activeKeys,
      recentUsage,
    }
  } catch (error) {
    console.error("Error fetching API key stats:", error)
    return null
  }
}

// ================================
// User Organization Queries
// ================================

/**
 * Get organizations user belongs to
 */
export async function getUserOrganizations() {
  try {
    const { userId } = auth()
    
    if (!userId) return []

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          include: {
            organization: {
              include: {
                _count: {
                  select: {
                    members: true,
                    apiKeys: true,
                    monitors: true,
                    subscriptions: true,
                  }
                }
              }
            }
          },
          orderBy: [
            { role: 'asc' }, // Owners first
            { joinedAt: 'asc' }
          ]
        }
      }
    })

    return user?.organizationMembers.map(membership => ({
      ...membership.organization,
      role: membership.role,
      joinedAt: membership.joinedAt,
    })) || []
  } catch (error) {
    console.error("Error fetching user organizations:", error)
    return []
  }
}

/**
 * Get user's role in specific organization
 */
export async function getUserRoleInOrganization(organizationId: string) {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    const membership = await db.organizationMember.findFirst({
      where: {
        user: { clerkId: userId },
        organizationId,
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    })

    return membership
  } catch (error) {
    console.error("Error fetching user role:", error)
    return null
  }
}

// ================================
// User Search and Admin Queries
// ================================

/**
 * Search users (admin only)
 */
export async function searchUsers(query: string, limit: number = 10) {
  try {
    const { userId } = auth()
    
    if (!userId) return []

    // Verify admin permissions
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

    const users = await db.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: {
        organizationMembers: {
          include: {
            organization: {
              select: {
                name: true,
                slug: true,
              }
            }
          }
        }
      },
      take: limit,
    })

    return users
  } catch (error) {
    console.error("Error searching users:", error)
    return []
  }
}

/**
 * Get all users with pagination (admin only)
 */
export async function getAllUsers(page: number = 1, limit: number = 20) {
  try {
    const { userId } = auth()
    
    if (!userId) return { users: [], total: 0, totalPages: 0 }

    // Verify admin permissions
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMembers: {
          where: { role: "OWNER" } // Only owners can see all users
        }
      }
    })

    if (!currentUser?.organizationMembers.length) {
      throw new Error("Insufficient permissions")
    }

    const offset = (page - 1) * limit

    const [users, total] = await Promise.all([
      db.user.findMany({
        include: {
          organizationMembers: {
            include: {
              organization: {
                select: {
                  name: true,
                  slug: true,
                }
              }
            }
          },
          _count: {
            select: {
              apiKeys: true,
              auditLogs: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.user.count()
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      users,
      total,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error("Error fetching all users:", error)
    return { users: [], total: 0, totalPages: 0, currentPage: 1 }
  }
}

// ================================
// User Statistics Queries
// ================================

/**
 * Get user statistics for admin dashboard
 */
export async function getUserStatistics() {
  try {
    const { userId } = auth()
    
    if (!userId) return null

    // Verify admin permissions
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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      activeUsers,
      usersWithApiKeys
    ] = await Promise.all([
      db.user.count(),
      
      db.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      db.user.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      
      db.user.count({
        where: {
          auditLogs: {
            some: {
              createdAt: { gte: sevenDaysAgo }
            }
          }
        }
      }),
      
      db.user.count({
        where: {
          apiKeys: {
            some: { isActive: true }
          }
        }
      })
    ])

    return {
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      activeUsers,
      usersWithApiKeys,
    }
  } catch (error) {
    console.error("Error fetching user statistics:", error)
    return null
  }
}