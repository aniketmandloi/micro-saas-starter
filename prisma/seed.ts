import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean up existing data
  await prisma.auditLog.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.monitorCheck.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.monitor.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create demo users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: "user_demo_owner",
        email: "owner@example.com",
        firstName: "John",
        lastName: "Owner",
        imageUrl: faker.image.avatar(),
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "user_demo_admin",
        email: "admin@example.com",
        firstName: "Jane",
        lastName: "Admin",
        imageUrl: faker.image.avatar(),
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "user_demo_member",
        email: "member@example.com",
        firstName: "Bob",
        lastName: "Member",
        imageUrl: faker.image.avatar(),
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "user_demo_viewer",
        email: "viewer@example.com",
        firstName: "Alice",
        lastName: "Viewer",
        imageUrl: faker.image.avatar(),
      },
    }),
  ]);

  console.log("👥 Created demo users");

  // Create demo organizations
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: "Acme Corporation",
        slug: "acme-corp",
        description: "A leading software company building amazing products",
        imageUrl: faker.image.url({ width: 400, height: 400 }),
        polarCustomerId: "cus_demo_acme",
        settings: {
          timezone: "America/New_York",
          currency: "usd",
          features: ["monitoring", "analytics", "api_keys"],
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: "TechStart Inc",
        slug: "techstart-inc",
        description: "An innovative startup disrupting the tech industry",
        imageUrl: faker.image.url({ width: 400, height: 400 }),
        polarCustomerId: "cus_demo_techstart",
        settings: {
          timezone: "America/Los_Angeles",
          currency: "usd",
          features: ["monitoring"],
        },
      },
    }),
  ]);

  console.log("🏢 Created demo organizations");

  // Create organization memberships
  await Promise.all([
    // Acme Corporation memberships
    prisma.organizationMember.create({
      data: {
        userId: users[0].id,
        organizationId: organizations[0].id,
        role: "OWNER",
        joinedAt: new Date(),
      },
    }),
    prisma.organizationMember.create({
      data: {
        userId: users[1].id,
        organizationId: organizations[0].id,
        role: "ADMIN",
        joinedAt: faker.date.recent({ days: 30 }),
      },
    }),
    prisma.organizationMember.create({
      data: {
        userId: users[2].id,
        organizationId: organizations[0].id,
        role: "MEMBER",
        joinedAt: faker.date.recent({ days: 15 }),
      },
    }),
    prisma.organizationMember.create({
      data: {
        userId: users[3].id,
        organizationId: organizations[0].id,
        role: "VIEWER",
        joinedAt: faker.date.recent({ days: 7 }),
      },
    }),
    // TechStart Inc memberships
    prisma.organizationMember.create({
      data: {
        userId: users[1].id,
        organizationId: organizations[1].id,
        role: "OWNER",
        joinedAt: faker.date.recent({ days: 60 }),
      },
    }),
  ]);

  console.log("👨‍💼 Created organization memberships");

  // Create demo subscriptions
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        organizationId: organizations[0].id,
        polarId: "sub_demo_acme_pro",
        status: "ACTIVE",
        planId: "plan_pro",
        planName: "Pro Plan",
        priceAmount: 4900, // $49.00
        priceCurrency: "usd",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        metadata: {
          features: ["unlimited_monitors", "advanced_analytics", "api_access"],
          limits: {
            monitors: -1,
            api_calls: 100000,
            team_members: 10,
          },
        },
      },
    }),
    prisma.subscription.create({
      data: {
        organizationId: organizations[1].id,
        polarId: "sub_demo_techstart_starter",
        status: "TRIALING",
        planId: "plan_starter",
        planName: "Starter Plan",
        priceAmount: 1900, // $19.00
        priceCurrency: "usd",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        metadata: {
          features: ["basic_monitoring", "email_alerts"],
          limits: {
            monitors: 5,
            api_calls: 10000,
            team_members: 3,
          },
        },
      },
    }),
  ]);

  console.log("💳 Created demo subscriptions");

  // Create demo API keys
  const apiKeys = await Promise.all([
    prisma.apiKey.create({
      data: {
        organizationId: organizations[0].id,
        userId: users[0].id,
        name: "Production API Key",
        keyHash: "$2a$10$demo.hash.for.production.key",
        prefix: "ak_prod_",
        permissions: ["read", "write", "monitor"],
        rateLimit: 5000,
        rateLimitWindow: 3600,
        lastUsedAt: faker.date.recent({ days: 1 }),
      },
    }),
    prisma.apiKey.create({
      data: {
        organizationId: organizations[0].id,
        userId: users[1].id,
        name: "Development API Key",
        keyHash: "$2a$10$demo.hash.for.development.key",
        prefix: "ak_dev_",
        permissions: ["read", "monitor"],
        rateLimit: 1000,
        rateLimitWindow: 3600,
        lastUsedAt: faker.date.recent({ days: 3 }),
      },
    }),
    prisma.apiKey.create({
      data: {
        organizationId: organizations[1].id,
        userId: users[1].id,
        name: "Starter API Key",
        keyHash: "$2a$10$demo.hash.for.starter.key",
        prefix: "ak_start_",
        permissions: ["read"],
        rateLimit: 500,
        rateLimitWindow: 3600,
      },
    }),
  ]);

  console.log("🔑 Created demo API keys");

  // Create demo monitors
  const monitors = await Promise.all([
    prisma.monitor.create({
      data: {
        organizationId: organizations[0].id,
        name: "Production Website",
        url: "https://acme-corp.com",
        method: "GET",
        expectedStatus: 200,
        timeout: 30,
        interval: 300,
        regions: ["us-east-1", "eu-west-1"],
        retryCount: 3,
      },
    }),
    prisma.monitor.create({
      data: {
        organizationId: organizations[0].id,
        name: "API Endpoint Health",
        url: "https://api.acme-corp.com/health",
        method: "GET",
        headers: {
          Authorization: "Bearer demo-token",
          "Content-Type": "application/json",
        },
        expectedStatus: 200,
        timeout: 15,
        interval: 60,
        regions: ["us-east-1"],
      },
    }),
    prisma.monitor.create({
      data: {
        organizationId: organizations[0].id,
        name: "Database Connection",
        url: "https://api.acme-corp.com/db-health",
        method: "GET",
        expectedStatus: 200,
        timeout: 10,
        interval: 300,
      },
    }),
    prisma.monitor.create({
      data: {
        organizationId: organizations[1].id,
        name: "TechStart Landing Page",
        url: "https://techstart.com",
        method: "GET",
        expectedStatus: 200,
        timeout: 30,
        interval: 600,
      },
    }),
  ]);

  console.log("📊 Created demo monitors");

  // Create demo monitor checks (historical data)
  const monitorChecks = [];
  for (const monitor of monitors) {
    for (let i = 0; i < 50; i++) {
      const status = faker.helpers.weightedArrayElement([
        { weight: 85, value: "UP" },
        { weight: 10, value: "DOWN" },
        { weight: 3, value: "TIMEOUT" },
        { weight: 2, value: "ERROR" },
      ]);

      monitorChecks.push(
        prisma.monitorCheck.create({
          data: {
            monitorId: monitor.id,
            status,
            responseTime:
              status === "UP" ? faker.number.int({ min: 50, max: 1500 }) : null,
            statusCode:
              status === "UP"
                ? 200
                : faker.helpers.arrayElement([404, 500, 502, 503]),
            errorMessage:
              status !== "UP"
                ? faker.helpers.arrayElement([
                    "Connection timeout",
                    "DNS resolution failed",
                    "SSL certificate error",
                    "Server error",
                  ])
                : null,
            region: faker.helpers.arrayElement([
              "us-east-1",
              "eu-west-1",
              "ap-southeast-1",
            ]),
            checkedAt: faker.date.recent({ days: 7 }),
          },
        })
      );
    }
  }

  await Promise.all(monitorChecks);

  console.log("📈 Created demo monitor checks");

  // Create demo incidents
  await Promise.all([
    prisma.incident.create({
      data: {
        monitorId: monitors[0].id,
        title: "Website Downtime",
        description: "Production website is returning 502 errors",
        status: "RESOLVED",
        severity: "HIGH",
        startedAt: faker.date.recent({ days: 5 }),
        resolvedAt: faker.date.recent({ days: 4 }),
        acknowledgedAt: faker.date.recent({ days: 5 }),
        metadata: {
          affectedRegions: ["us-east-1"],
          errorCount: 15,
          duration: "45 minutes",
        },
      },
    }),
    prisma.incident.create({
      data: {
        monitorId: monitors[1].id,
        title: "API Latency Spike",
        description: "API response times increased significantly",
        status: "MONITORING",
        severity: "MEDIUM",
        startedAt: faker.date.recent({ days: 1 }),
        acknowledgedAt: faker.date.recent({ days: 1 }),
        metadata: {
          avgResponseTime: "2.5s",
          threshold: "1s",
        },
      },
    }),
  ]);

  console.log("🚨 Created demo incidents");

  // Create usage records for analytics
  const usageRecords = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);

    // API calls usage
    usageRecords.push(
      prisma.usageRecord.create({
        data: {
          organizationId: organizations[0].id,
          subscriptionId: subscriptions[0].id,
          metricName: "api_calls",
          quantity: faker.number.int({ min: 1000, max: 5000 }),
          timestamp: date,
          metadata: {
            source: "api_gateway",
            endpoint: "/api/v1/monitors",
          },
        },
      })
    );

    // Monitor checks usage
    usageRecords.push(
      prisma.usageRecord.create({
        data: {
          organizationId: organizations[0].id,
          subscriptionId: subscriptions[0].id,
          metricName: "monitor_checks",
          quantity: faker.number.int({ min: 100, max: 500 }),
          timestamp: date,
          metadata: {
            source: "monitoring_service",
          },
        },
      })
    );

    // Smaller org usage
    usageRecords.push(
      prisma.usageRecord.create({
        data: {
          organizationId: organizations[1].id,
          subscriptionId: subscriptions[1].id,
          metricName: "api_calls",
          quantity: faker.number.int({ min: 100, max: 800 }),
          timestamp: date,
          metadata: {
            source: "api_gateway",
          },
        },
      })
    );
  }

  await Promise.all(usageRecords);

  console.log("📊 Created usage records");

  // Create email templates
  await Promise.all([
    prisma.emailTemplate.create({
      data: {
        name: "welcome_email",
        subject: "Welcome to {{organizationName}}!",
        htmlContent: `
          <h1>Welcome {{firstName}}!</h1>
          <p>Thank you for joining {{organizationName}}. We're excited to have you on board!</p>
          <p>Get started by setting up your first monitor.</p>
          <a href="{{dashboardUrl}}">Go to Dashboard</a>
        `,
        textContent:
          "Welcome {{firstName}}! Thank you for joining {{organizationName}}.",
        variables: ["firstName", "organizationName", "dashboardUrl"],
      },
    }),
    prisma.emailTemplate.create({
      data: {
        name: "incident_alert",
        subject: "🚨 Incident: {{incidentTitle}}",
        htmlContent: `
          <h2>Incident Alert</h2>
          <p><strong>Monitor:</strong> {{monitorName}}</p>
          <p><strong>Status:</strong> {{incidentStatus}}</p>
          <p><strong>Severity:</strong> {{severity}}</p>
          <p><strong>Started:</strong> {{startTime}}</p>
          <p>{{description}}</p>
          <a href="{{incidentUrl}}">View Incident Details</a>
        `,
        textContent:
          "Incident Alert: {{incidentTitle}} - {{monitorName}} is {{incidentStatus}}",
        variables: [
          "incidentTitle",
          "monitorName",
          "incidentStatus",
          "severity",
          "startTime",
          "description",
          "incidentUrl",
        ],
      },
    }),
    prisma.emailTemplate.create({
      data: {
        name: "quota_warning",
        subject: "Usage Quota Warning - {{organizationName}}",
        htmlContent: `
          <h2>Usage Quota Warning</h2>
          <p>Your organization has used {{usagePercentage}}% of your monthly {{metricName}} quota.</p>
          <p><strong>Current Usage:</strong> {{currentUsage}}</p>
          <p><strong>Plan Limit:</strong> {{planLimit}}</p>
          <p>Consider upgrading your plan to avoid service interruption.</p>
          <a href="{{billingUrl}}">Manage Billing</a>
        `,
        textContent:
          "Usage Warning: {{usagePercentage}}% of {{metricName}} quota used.",
        variables: [
          "organizationName",
          "usagePercentage",
          "metricName",
          "currentUsage",
          "planLimit",
          "billingUrl",
        ],
      },
    }),
  ]);

  console.log("📧 Created email templates");

  // Create audit logs for recent activities
  const auditLogs = [];
  for (let i = 0; i < 20; i++) {
    auditLogs.push(
      prisma.auditLog.create({
        data: {
          organizationId: faker.helpers.arrayElement(organizations).id,
          userId: faker.helpers.arrayElement(users).id,
          action: faker.helpers.arrayElement([
            "user.login",
            "monitor.created",
            "api_key.created",
            "subscription.updated",
            "incident.resolved",
            "team.member_added",
          ]),
          resourceType: faker.helpers.arrayElement([
            "user",
            "monitor",
            "api_key",
            "subscription",
            "incident",
          ]),
          resourceId: faker.string.uuid(),
          metadata: {
            ip: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
            location: faker.location.city(),
          },
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          timestamp: faker.date.recent({ days: 7 }),
        },
      })
    );
  }

  await Promise.all(auditLogs);

  console.log("📋 Created audit logs");

  console.log("✅ Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  • ${users.length} users created`);
  console.log(`  • ${organizations.length} organizations created`);
  console.log(`  • ${subscriptions.length} subscriptions created`);
  console.log(`  • ${apiKeys.length} API keys created`);
  console.log(`  • ${monitors.length} monitors created`);
  console.log(`  • 200+ monitor checks created`);
  console.log(`  • 2 incidents created`);
  console.log(`  • 90+ usage records created`);
  console.log(`  • 3 email templates created`);
  console.log(`  • 20 audit logs created`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
