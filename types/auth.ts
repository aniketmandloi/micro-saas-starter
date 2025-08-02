export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"

export interface UserProfile {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}