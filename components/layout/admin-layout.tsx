"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Database,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Overview", href: "/admin", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "System Health", href: "/admin/health", icon: Activity },
  { name: "Database", href: "/admin/database", icon: Database },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 lg:px-8">
          <div className="flex items-center space-x-4">
            <Logo />
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">
                Admin Panel
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-muted/10 lg:block">
          <div className="flex h-full flex-col">
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
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
              <div className="rounded-lg bg-orange-50 p-4 text-sm border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Admin Access</h4>
                </div>
                <p className="text-orange-700 text-xs">
                  You have administrative privileges. Please use responsibly.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
