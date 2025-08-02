import { z } from "zod"

const envSchema = z.object({
  // Next.js & App Configuration
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Database Configuration
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  POSTGRES_PRISMA_URL: z.string().optional(),
  POSTGRES_URL_NON_POOLING: z.string().optional(),
  
  // Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/dashboard"),
  
  // Payment Processing (Polar)
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_SERVER_URL: z.string().url().default("https://api.polar.sh"),
  NEXT_PUBLIC_POLAR_ORGANIZATION_ID: z.string().optional(),
  
  // Rate Limiting & Caching (Upstash Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Analytics (PostHog)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default("https://app.posthog.com"),
  POSTHOG_PERSONAL_API_KEY: z.string().optional(),
  
  // Email Service (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_REPLY_TO_EMAIL: z.string().email().optional(),
  
  // Error Monitoring (Sentry)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // File Storage (Supabase)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // File Storage (AWS S3)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === "true").default("true"),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z.string().transform(val => val === "true").default("true"),
  NEXT_PUBLIC_ENABLE_FEATURE_FLAGS: z.string().transform(val => val === "true").default("true"),
  NEXT_PUBLIC_ENABLE_MONITORING_DEMO: z.string().transform(val => val === "true").default("true"),
  
  // Security Configuration
  ENCRYPTION_SECRET: z.string().min(32).optional(),
  API_SECRET_KEY: z.string().min(32).optional(),
  
  // Rate Limiting Configuration
  DEFAULT_RATE_LIMIT_PER_HOUR: z.string().transform(Number).default("1000"),
  DEFAULT_RATE_LIMIT_PER_MINUTE: z.string().transform(Number).default("100"),
  
  // Monitoring Configuration
  DEFAULT_MONITOR_INTERVAL: z.string().transform(Number).default("300"),
  DEFAULT_MONITOR_TIMEOUT: z.string().transform(Number).default("30"),
  
  // Development Configuration
  SKIP_ENV_VALIDATION: z.string().transform(val => val === "true").default("false"),
  ENABLE_QUERY_LOGGING: z.string().transform(val => val === "true").default("false"),
  ENABLE_PRISMA_STUDIO: z.string().transform(val => val === "true").default("true"),
  DATABASE_GUI_PASSWORD: z.string().optional(),
})

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
  
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  
  POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
  POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
  POLAR_SERVER_URL: process.env.POLAR_SERVER_URL,
  NEXT_PUBLIC_POLAR_ORGANIZATION_ID: process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID,
  
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  POSTHOG_PERSONAL_API_KEY: process.env.POSTHOG_PERSONAL_API_KEY,
  
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
  
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  
  NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
  NEXT_PUBLIC_ENABLE_FEATURE_FLAGS: process.env.NEXT_PUBLIC_ENABLE_FEATURE_FLAGS,
  NEXT_PUBLIC_ENABLE_MONITORING_DEMO: process.env.NEXT_PUBLIC_ENABLE_MONITORING_DEMO,
  
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  API_SECRET_KEY: process.env.API_SECRET_KEY,
  
  DEFAULT_RATE_LIMIT_PER_HOUR: process.env.DEFAULT_RATE_LIMIT_PER_HOUR,
  DEFAULT_RATE_LIMIT_PER_MINUTE: process.env.DEFAULT_RATE_LIMIT_PER_MINUTE,
  
  DEFAULT_MONITOR_INTERVAL: process.env.DEFAULT_MONITOR_INTERVAL,
  DEFAULT_MONITOR_TIMEOUT: process.env.DEFAULT_MONITOR_TIMEOUT,
  
  SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  ENABLE_QUERY_LOGGING: process.env.ENABLE_QUERY_LOGGING,
  ENABLE_PRISMA_STUDIO: process.env.ENABLE_PRISMA_STUDIO,
  DATABASE_GUI_PASSWORD: process.env.DATABASE_GUI_PASSWORD,
}

// Skip validation in test environment or when explicitly skipped
const skipValidation = 
  process.env.NODE_ENV === "test" || 
  process.env.SKIP_ENV_VALIDATION === "true"

const parsed = skipValidation ? processEnv : envSchema.safeParse(processEnv)

if (!skipValidation && !parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  )
  throw new Error("Invalid environment variables")
}

export const env = skipValidation ? processEnv : parsed.data

// Type-safe environment variables with better types
export type EnvConfig = typeof env

// Helper functions for checking service availability
export const isClerkConfigured = () => !!(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY)
export const isPolarConfigured = () => !!(env.POLAR_ACCESS_TOKEN)
export const isRedisConfigured = () => !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
export const isPostHogConfigured = () => !!(env.NEXT_PUBLIC_POSTHOG_KEY)
export const isResendConfigured = () => !!(env.RESEND_API_KEY)
export const isSentryConfigured = () => !!(env.NEXT_PUBLIC_SENTRY_DSN)
export const isSupabaseConfigured = () => !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export const isS3Configured = () => !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET)

// Service status checker
export const getServiceStatus = () => ({
  clerk: isClerkConfigured(),
  polar: isPolarConfigured(), 
  redis: isRedisConfigured(),
  posthog: isPostHogConfigured(),
  resend: isResendConfigured(),
  sentry: isSentryConfigured(),
  supabase: isSupabaseConfigured(),
  s3: isS3Configured(),
})

// Development helper to validate required services
export const validateRequiredServices = (required: (keyof ReturnType<typeof getServiceStatus>)[]) => {
  const status = getServiceStatus()
  const missing = required.filter(service => !status[service])
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing required services: ${missing.join(", ")}`)
    if (env.NODE_ENV === "production") {
      throw new Error(`Missing required services: ${missing.join(", ")}`)
    }
  }
  
  return status
}