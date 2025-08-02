export const APP_NAME = "Micro SaaS Starter"
export const APP_DESCRIPTION = "A comprehensive Next.js TypeScript starter kit for micro-SaaS products"
export const APP_VERSION = "1.0.0"
export const APP_AUTHOR = "Micro SaaS Starter Team"

export const ROUTES = {
  // Public routes
  HOME: "/",
  PRICING: "/pricing",
  FEATURES: "/features",
  DOCS: "/docs",
  BLOG: "/blog",
  CONTACT: "/contact",
  ABOUT: "/about",
  
  // Auth routes
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  
  // Dashboard routes
  DASHBOARD: "/dashboard",
  DASHBOARD_ANALYTICS: "/dashboard/analytics",
  DASHBOARD_TEAM: "/dashboard/team",
  DASHBOARD_API_KEYS: "/dashboard/api-keys",
  DASHBOARD_BILLING: "/dashboard/billing",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_MONITORS: "/dashboard/monitors",
  DASHBOARD_NOTIFICATIONS: "/dashboard/notifications",
  DASHBOARD_AUDIT_LOGS: "/dashboard/audit-logs",
  
  // Admin routes
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_ORGANIZATIONS: "/admin/organizations",
  ADMIN_SUBSCRIPTIONS: "/admin/subscriptions",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_SYSTEM: "/admin/system",
  
  // Legal routes
  PRIVACY: "/privacy",
  TERMS: "/terms",
  COOKIES: "/cookies",
} as const

export const API_ROUTES = {
  // Webhooks
  WEBHOOKS_CLERK: "/api/webhooks/clerk",
  WEBHOOKS_POLAR: "/api/webhooks/polar",
  
  // Core API
  ORGANIZATIONS: "/api/organizations",
  SUBSCRIPTIONS: "/api/subscriptions",
  USAGE: "/api/usage",
  AUTH_VALIDATE: "/api/auth/validate",
  
  // Monitoring
  MONITORS: "/api/monitors",
  MONITORS_CHECK: "/api/monitors/check",
  INCIDENTS: "/api/incidents",
  
  // Communication
  EMAILS_SEND: "/api/emails/send",
  NOTIFICATIONS: "/api/notifications",
  
  // System
  HEALTH: "/api/health",
  STATUS: "/api/status",
  
  // Admin
  ADMIN_STATS: "/api/admin/stats",
  ADMIN_USERS: "/api/admin/users",
  
  // File uploads
  UPLOAD: "/api/upload",
  FILES: "/api/files",
} as const

export const DEFAULT_RATE_LIMITS = {
  API_KEY: 1000, // requests per hour
  WEBHOOK: 100, // requests per hour
  AUTH: 10, // requests per minute
  UPLOAD: 5, // requests per minute
  EMAIL: 20, // requests per hour
} as const

export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  STARTER: "starter", 
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  CANCELED: "CANCELED",
  INCOMPLETE: "INCOMPLETE", 
  INCOMPLETE_EXPIRED: "INCOMPLETE_EXPIRED",
  PAST_DUE: "PAST_DUE",
  TRIALING: "TRIALING",
  UNPAID: "UNPAID",
} as const

export const ORGANIZATION_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN", 
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const

export const USAGE_METRICS = {
  API_CALLS: "api_calls",
  STORAGE: "storage",
  MONITORS: "monitors",
  TEAM_MEMBERS: "team_members",
  EMAIL_SENDS: "email_sends",
  FILE_UPLOADS: "file_uploads",
} as const

export const MONITOR_STATUS = {
  UP: "UP",
  DOWN: "DOWN", 
  TIMEOUT: "TIMEOUT",
  ERROR: "ERROR",
} as const

export const INCIDENT_STATUS = {
  OPEN: "OPEN",
  INVESTIGATING: "INVESTIGATING",
  IDENTIFIED: "IDENTIFIED", 
  MONITORING: "MONITORING",
  RESOLVED: "RESOLVED",
} as const

export const NOTIFICATION_TYPES = {
  EMAIL: "email",
  WEBHOOK: "webhook",
  SLACK: "slack",
  DISCORD: "discord",
} as const

export const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  INVITATION: "invitation",
  PASSWORD_RESET: "password_reset",
  BILLING_SUCCESS: "billing_success",
  BILLING_FAILED: "billing_failed",
  QUOTA_EXCEEDED: "quota_exceeded",
  MONITOR_DOWN: "monitor_down",
  MONITOR_UP: "monitor_up",
} as const

export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: "enable_analytics",
  ENABLE_MONITORING: "enable_monitoring", 
  ENABLE_BILLING: "enable_billing",
  ENABLE_TEAM_FEATURES: "enable_team_features",
  ENABLE_API_KEYS: "enable_api_keys",
  ENABLE_FILE_UPLOADS: "enable_file_uploads",
  ENABLE_NOTIFICATIONS: "enable_notifications",
} as const

export const DEFAULT_LIMITS = {
  FREE: {
    [USAGE_METRICS.API_CALLS]: 1000,
    [USAGE_METRICS.STORAGE]: 100 * 1024 * 1024, // 100MB
    [USAGE_METRICS.MONITORS]: 5,
    [USAGE_METRICS.TEAM_MEMBERS]: 1,
    [USAGE_METRICS.EMAIL_SENDS]: 100,
    [USAGE_METRICS.FILE_UPLOADS]: 10,
  },
  STARTER: {
    [USAGE_METRICS.API_CALLS]: 10000,
    [USAGE_METRICS.STORAGE]: 1024 * 1024 * 1024, // 1GB
    [USAGE_METRICS.MONITORS]: 25,
    [USAGE_METRICS.TEAM_MEMBERS]: 5,
    [USAGE_METRICS.EMAIL_SENDS]: 1000,
    [USAGE_METRICS.FILE_UPLOADS]: 100,
  },
  PRO: {
    [USAGE_METRICS.API_CALLS]: 100000,
    [USAGE_METRICS.STORAGE]: 10 * 1024 * 1024 * 1024, // 10GB
    [USAGE_METRICS.MONITORS]: 100,
    [USAGE_METRICS.TEAM_MEMBERS]: 25,
    [USAGE_METRICS.EMAIL_SENDS]: 10000,
    [USAGE_METRICS.FILE_UPLOADS]: 1000,
  },
  ENTERPRISE: {
    [USAGE_METRICS.API_CALLS]: -1, // unlimited
    [USAGE_METRICS.STORAGE]: -1, // unlimited
    [USAGE_METRICS.MONITORS]: -1, // unlimited
    [USAGE_METRICS.TEAM_MEMBERS]: -1, // unlimited
    [USAGE_METRICS.EMAIL_SENDS]: -1, // unlimited
    [USAGE_METRICS.FILE_UPLOADS]: -1, // unlimited
  },
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "text/plain", "text/csv"],
  MAX_FILES_PER_UPLOAD: 5,
} as const

export const CACHE_KEYS = {
  USER_ORGANIZATIONS: "user:organizations:",
  ORGANIZATION_MEMBERS: "org:members:",
  SUBSCRIPTION_PLAN: "subscription:plan:",
  USAGE_METRICS: "usage:metrics:",
  MONITOR_STATUS: "monitor:status:",
  API_KEY_LIMITS: "api:limits:",
} as const

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes  
  LONG: 3600, // 1 hour
  DAILY: 86400, // 24 hours
} as const