import type {
  User as ClerkUser,
  Organization as ClerkOrganization,
} from "@clerk/nextjs/server";
import type { OrganizationRole } from "./database";

// Re-export from database types for consistency
export type { OrganizationRole } from "./database";

// ================================
// Clerk Type Extensions
// ================================

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Clerk user with database sync
export interface AuthUser extends UserProfile {
  clerkUser: ClerkUser;
  organizations: AuthOrganization[];
  activeOrganization?: AuthOrganization;
}

// Extended Clerk organization with database sync
export interface AuthOrganization {
  id: string;
  clerkId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  role: OrganizationRole;
  clerkOrganization: ClerkOrganization;
}

// ================================
// Authentication Context Types
// ================================

export interface AuthContextValue {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  organizations: AuthOrganization[];
  isLoaded: boolean;
  isSignedIn: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ================================
// Session and Token Types
// ================================

export interface SessionData {
  userId: string;
  organizationId?: string;
  role?: OrganizationRole;
  permissions: string[];
  expiresAt: Date;
}

export interface ApiKeyAuth {
  keyId: string;
  organizationId: string;
  permissions: string[];
  rateLimit: number;
  rateLimitWindow: number;
}

// ================================
// Webhook Types
// ================================

export interface ClerkWebhookEvent {
  type:
    | "user.created"
    | "user.updated"
    | "user.deleted"
    | "organization.created"
    | "organization.updated"
    | "organization.deleted"
    | "organizationMembership.created"
    | "organizationMembership.updated"
    | "organizationMembership.deleted";
  data: {
    id: string;
    object: string;
    attributes?: Record<string, unknown>;
    [key: string]: unknown;
  };
  timestamp: number;
  event_attributes?: Record<string, unknown>;
}

// ================================
// Permission Types
// ================================

export type Permission =
  | "organization:read"
  | "organization:write"
  | "organization:delete"
  | "organization:members:read"
  | "organization:members:write"
  | "organization:members:delete"
  | "organization:billing:read"
  | "organization:billing:write"
  | "organization:settings:read"
  | "organization:settings:write"
  | "api_keys:read"
  | "api_keys:write"
  | "api_keys:delete"
  | "monitors:read"
  | "monitors:write"
  | "monitors:delete"
  | "analytics:read"
  | "audit_logs:read";

export const ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  OWNER: [
    "organization:read",
    "organization:write",
    "organization:delete",
    "organization:members:read",
    "organization:members:write",
    "organization:members:delete",
    "organization:billing:read",
    "organization:billing:write",
    "organization:settings:read",
    "organization:settings:write",
    "api_keys:read",
    "api_keys:write",
    "api_keys:delete",
    "monitors:read",
    "monitors:write",
    "monitors:delete",
    "analytics:read",
    "audit_logs:read",
  ],
  ADMIN: [
    "organization:read",
    "organization:write",
    "organization:members:read",
    "organization:members:write",
    "organization:billing:read",
    "organization:settings:read",
    "organization:settings:write",
    "api_keys:read",
    "api_keys:write",
    "api_keys:delete",
    "monitors:read",
    "monitors:write",
    "monitors:delete",
    "analytics:read",
    "audit_logs:read",
  ],
  MEMBER: [
    "organization:read",
    "organization:members:read",
    "organization:billing:read",
    "organization:settings:read",
    "api_keys:read",
    "api_keys:write",
    "monitors:read",
    "monitors:write",
    "monitors:delete",
    "analytics:read",
  ],
  VIEWER: [
    "organization:read",
    "organization:members:read",
    "organization:billing:read",
    "api_keys:read",
    "monitors:read",
    "analytics:read",
  ],
};

// ================================
// Auth Utility Types
// ================================

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

// ================================
// Form Types
// ================================

export interface SignInFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  acceptTerms: boolean;
}
