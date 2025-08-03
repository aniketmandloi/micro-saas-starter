"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Key,
  CreditCard,
  Settings,
  Monitor,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser, AuthOrganization } from "@/types/auth";
import { ROLE_PERMISSIONS } from "@/types/auth";

interface DashboardNavProps {
  user: AuthUser | null;
  organization: AuthOrganization | null;
}

export function DashboardNav({ user, organization }: DashboardNavProps) {
  const pathname = usePathname();

  // Check if user has permission for a route
  const hasPermission = (permission: string) => {
    if (!organization?.role) return false;
    const rolePermissions = ROLE_PERMISSIONS[organization.role];
    return rolePermissions.includes(permission as never);
  };

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: BarChart3,
      permission: "organization:read",
    },
    {
      name: "Monitors",
      href: "/dashboard/monitors",
      icon: Monitor,
      permission: "monitors:read",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: Activity,
      permission: "analytics:read",
    },
    {
      name: "Team",
      href: "/dashboard/team",
      icon: Users,
      permission: "organization:members:read",
    },
    {
      name: "API Keys",
      href: "/dashboard/api-keys",
      icon: Key,
      permission: "api_keys:read",
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
      permission: "organization:billing:read",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      permission: "organization:settings:read",
    },
  ];

  // Admin-only routes
  const adminNavigation = [
    {
      name: "Audit Logs",
      href: "/dashboard/audit",
      icon: Shield,
      permission: "audit_logs:read",
    },
  ];

  return (
    <nav className="flex flex-col h-full">
      <div className="p-6">
        {/* Organization Info */}
        {organization && (
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              {organization.imageUrl ? (
                <img
                  src={organization.imageUrl}
                  alt={organization.name}
                  className="h-8 w-8 rounded-lg"
                />
              ) : (
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {organization.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {organization.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {organization.role.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const canAccess = hasPermission(item.permission);

            if (!canAccess) return null;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Admin Navigation */}
        {adminNavigation.some((item) => hasPermission(item.permission)) && (
          <div className="mt-6">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Admin
              </h3>
            </div>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                const canAccess = hasPermission(item.permission);

                if (!canAccess) return null;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto p-6 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>Micro SaaS Starter</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </nav>
  );
}
