import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentOrganization } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Key,
  Monitor,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Dashboard - Overview",
  description: "Overview of your organization's activity and metrics.",
};

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");

  // Get current user and organization
  const [user, organization] = await Promise.all([
    getCurrentUser(),
    getCurrentOrganization(),
  ]);

  if (!organization) {
    redirect("/onboarding");
  }

  // Get organization statistics
  const [stats, recentActivity] = await Promise.all([
    getOrganizationStats(organization.id),
    getRecentActivity(organization.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.firstName || "User"}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with {organization.name} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members}</div>
            <p className="text-xs text-muted-foreground">
              {organization.role === "OWNER"
                ? "You have full access"
                : `You are ${organization.role.toLowerCase()}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiKeys}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeApiKeys} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitors</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monitors}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeMonitors} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uptime}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent activity found.
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 text-sm"
                  >
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        {formatActivityMessage(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks based on your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organization.role === "OWNER" && (
                <>
                  <QuickActionButton
                    href="/dashboard/team"
                    icon={<Users className="h-4 w-4" />}
                    title="Invite Team Members"
                    description="Add new members to your organization"
                  />
                  <QuickActionButton
                    href="/dashboard/billing"
                    icon={<TrendingUp className="h-4 w-4" />}
                    title="Manage Billing"
                    description="View subscription and usage"
                  />
                </>
              )}

              {["OWNER", "ADMIN", "MEMBER"].includes(organization.role) && (
                <QuickActionButton
                  href="/dashboard/monitors"
                  icon={<Monitor className="h-4 w-4" />}
                  title="Add Monitor"
                  description="Monitor a new API endpoint"
                />
              )}

              <QuickActionButton
                href="/dashboard/api-keys"
                icon={<Key className="h-4 w-4" />}
                title="Create API Key"
                description="Generate a new API key"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ================================
// Helper Components
// ================================

function QuickActionButton({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
    >
      <div className="flex-shrink-0 text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </a>
  );
}

// ================================
// Data Fetching Functions
// ================================

async function getOrganizationStats(organizationId: string) {
  const [
    memberCount,
    [totalApiKeys, activeApiKeys],
    [totalMonitors, activeMonitors],
    totalChecks,
  ] = await Promise.all([
    // Member count
    db.organizationMember.count({
      where: { organizationId },
    }),

    // API key stats
    Promise.all([
      db.apiKey.count({ where: { organizationId } }),
      db.apiKey.count({ where: { organizationId, isActive: true } }),
    ]),

    // Monitor stats
    Promise.all([
      db.monitor.count({ where: { organizationId } }),
      db.monitor.count({ where: { organizationId, isActive: true } }),
    ]),

    // Uptime calculation (simplified)
    db.monitorCheck.count({
      where: {
        monitor: { organizationId },
        checkedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  // Calculate uptime percentage
  const successfulChecks = await db.monitorCheck.count({
    where: {
      monitor: { organizationId },
      status: "UP",
      checkedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const uptime =
    totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 100) : 100;

  return {
    members: memberCount,
    apiKeys: totalApiKeys || 0,
    activeApiKeys: activeApiKeys || 0,
    monitors: totalMonitors || 0,
    activeMonitors: activeMonitors || 0,
    uptime,
  };
}

async function getRecentActivity(organizationId: string) {
  return db.auditLog.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

// ================================
// Helper Functions
// ================================

function getActivityIcon(action: string) {
  if (action.includes("created")) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (action.includes("deleted")) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  return <Clock className="h-4 w-4 text-blue-500" />;
}

function formatActivityMessage(activity: {
  action: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}) {
  const userName = activity.user
    ? `${activity.user.firstName} ${activity.user.lastName}`.trim() ||
      activity.user.email
    : "Someone";

  const actionMap: Record<string, string> = {
    "organization.created": "created the organization",
    "user.joined": "joined the organization",
    "api_key.created": "created an API key",
    "monitor.created": "created a monitor",
    "monitor.updated": "updated a monitor",
    "subscription.created": "created a subscription",
  };

  return `${userName} ${actionMap[activity.action] || activity.action}`;
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return new Date(date).toLocaleDateString();
}
