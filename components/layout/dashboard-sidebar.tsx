"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Users,
  Key,
  CreditCard,
  Settings,
  Monitor,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Monitors", href: "/dashboard/monitors", icon: Monitor },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden w-64 border-r bg-muted/10 lg:block">
      <div className="flex h-full flex-col">
        <div className="p-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
        </nav>
        <div className="p-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <h4 className="font-medium">Need help?</h4>
            <p className="text-muted-foreground">Check our documentation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
