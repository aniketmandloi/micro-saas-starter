import {
  type Prisma,
  type User,
  type Organization,
  type OrganizationMember,
  type OrganizationRole,
  type Subscription,
  type SubscriptionStatus,
  type UsageRecord,
  type ApiKey,
  type Monitor,
  type MonitorCheck,
  type CheckStatus,
  type Incident,
  type IncidentStatus,
  type IncidentSeverity,
  type AuditLog,
  type NotificationPreference,
  type NotificationType,
  type NotificationChannel,
  type EmailTemplate,
} from "@prisma/client";

// ================================
// Core Database Types
// ================================

// Re-export Prisma generated types for convenience
export type {
  User,
  Organization,
  OrganizationMember,
  OrganizationRole,
  Subscription,
  SubscriptionStatus,
  UsageRecord,
  ApiKey,
  Monitor,
  MonitorCheck,
  CheckStatus,
  Incident,
  IncidentStatus,
  IncidentSeverity,
  AuditLog,
  NotificationPreference,
  NotificationType,
  NotificationChannel,
  EmailTemplate,
};

// ================================
// Extended Types with Relations
// ================================

// User with organization memberships
export type UserWithOrganizations = Prisma.UserGetPayload<{
  include: {
    organizationMembers: {
      include: {
        organization: true;
      };
    };
  };
}>;

// Organization with full relations
export type OrganizationWithDetails = Prisma.OrganizationGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
    subscriptions: true;
    apiKeys: true;
    monitors: true;
    _count: {
      select: {
        members: true;
        apiKeys: true;
        monitors: true;
        usageRecords: true;
      };
    };
  };
}>;

// Organization with members only
export type OrganizationWithMembers = Prisma.OrganizationGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
  };
}>;

// Monitor with recent checks and incidents
export type MonitorWithDetails = Prisma.MonitorGetPayload<{
  include: {
    checks: {
      orderBy: {
        checkedAt: "desc";
      };
      take: 10;
    };
    incidents: {
      where: {
        status: {
          not: "RESOLVED";
        };
      };
    };
    organization: true;
  };
}>;

// Subscription with usage records
export type SubscriptionWithUsage = Prisma.SubscriptionGetPayload<{
  include: {
    usageRecords: {
      orderBy: {
        timestamp: "desc";
      };
      take: 30;
    };
    organization: true;
  };
}>;

// API Key with organization
export type ApiKeyWithOrganization = Prisma.ApiKeyGetPayload<{
  include: {
    organization: true;
    user: true;
  };
}>;

// Incident with monitor details
export type IncidentWithMonitor = Prisma.IncidentGetPayload<{
  include: {
    monitor: {
      include: {
        organization: true;
      };
    };
  };
}>;

// ================================
// Input Types for Forms and Actions
// ================================

// Organization creation input
export type CreateOrganizationInput = {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
};

// Organization update input
export type UpdateOrganizationInput = {
  name?: string;
  description?: string;
  imageUrl?: string;
  settings?: Prisma.JsonValue;
};

// Monitor creation input
export type CreateMonitorInput = {
  organizationId: string;
  name: string;
  url: string;
  method?: string;
  headers?: Prisma.JsonValue;
  body?: string;
  expectedStatus?: number;
  timeout?: number;
  interval?: number;
  regions?: string[];
};

// Monitor update input
export type UpdateMonitorInput = {
  name?: string;
  url?: string;
  method?: string;
  headers?: Prisma.JsonValue;
  body?: string;
  expectedStatus?: number;
  timeout?: number;
  interval?: number;
  isActive?: boolean;
  regions?: string[];
};

// API Key creation input
export type CreateApiKeyInput = {
  organizationId: string;
  name: string;
  permissions: string[];
  rateLimit?: number;
  rateLimitWindow?: number;
  expiresAt?: Date;
};

// User invitation input
export type InviteUserInput = {
  organizationId: string;
  email: string;
  role: OrganizationRole;
};

// Usage tracking input
export type TrackUsageInput = {
  organizationId: string;
  subscriptionId?: string;
  metricName: string;
  quantity: number;
  metadata?: Prisma.JsonValue;
};

// ================================
// Analytics and Reporting Types
// ================================

// Usage metrics aggregation
export type UsageMetrics = {
  totalApiCalls: number;
  totalMonitorChecks: number;
  activeMonitors: number;
  avgResponseTime: number;
  uptimePercentage: number;
  incidentsCount: number;
  period: {
    start: Date;
    end: Date;
  };
};

// Monitor uptime statistics
export type MonitorUptimeStats = {
  monitorId: string;
  monitorName: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  avgResponseTime: number;
  incidentsCount: number;
  lastCheck?: Date;
  status: CheckStatus;
};

// Organization analytics
export type OrganizationAnalytics = {
  totalMembers: number;
  totalApiKeys: number;
  totalMonitors: number;
  totalIncidents: number;
  monthlyUsage: {
    apiCalls: number;
    monitorChecks: number;
  };
  quotaUsage: {
    apiCalls: {
      used: number;
      limit: number;
      percentage: number;
    };
    monitors: {
      used: number;
      limit: number;
      percentage: number;
    };
    teamMembers: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
};

// Time series data point
export type TimeSeriesDataPoint = {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
};

// Chart data for analytics
export type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
};

// ================================
// API Response Types
// ================================

// Standard API response wrapper
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
};

// Paginated response
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

// ================================
// Database Operation Types
// ================================

// Include options for Prisma queries
export type UserInclude = Prisma.UserInclude;
export type OrganizationInclude = Prisma.OrganizationInclude;
export type MonitorInclude = Prisma.MonitorInclude;
export type SubscriptionInclude = Prisma.SubscriptionInclude;

// Where clauses for filtering
export type UserWhereInput = Prisma.UserWhereInput;
export type OrganizationWhereInput = Prisma.OrganizationWhereInput;
export type MonitorWhereInput = Prisma.MonitorWhereInput;
export type IncidentWhereInput = Prisma.IncidentWhereInput;

// Order by options
export type UserOrderByInput = Prisma.UserOrderByWithRelationInput;
export type OrganizationOrderByInput =
  Prisma.OrganizationOrderByWithRelationInput;
export type MonitorOrderByInput = Prisma.MonitorOrderByWithRelationInput;

// ================================
// Utility Types
// ================================

// Extract enum values as union types
export type OrganizationRoleValues = `${OrganizationRole}`;
export type SubscriptionStatusValues = `${SubscriptionStatus}`;
export type CheckStatusValues = `${CheckStatus}`;
export type IncidentStatusValues = `${IncidentStatus}`;
export type IncidentSeverityValues = `${IncidentSeverity}`;
export type NotificationTypeValues = `${NotificationType}`;
export type NotificationChannelValues = `${NotificationChannel}`;

// Partial types for updates
export type PartialUser = Partial<User>;
export type PartialOrganization = Partial<Organization>;
export type PartialMonitor = Partial<Monitor>;

// Database transaction type
export type DatabaseTransaction = Prisma.TransactionClient;

// Action result type for server actions
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ================================
// Webhook and Event Types
// ================================

// Polar webhook event types
export type PolarWebhookEvent = {
  type:
    | "subscription.created"
    | "subscription.updated"
    | "subscription.cancelled"
    | "invoice.payment_succeeded"
    | "invoice.payment_failed";
  data: Record<string, unknown>;
  createdAt: string;
};

// PostHog event tracking
export type AnalyticsEvent = {
  userId: string;
  organizationId?: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
};

// Audit log data
export type AuditLogData = {
  organizationId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.JsonValue;
  ipAddress?: string;
  userAgent?: string;
};
