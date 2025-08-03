import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentOrganization } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/onboarding");
  }

  // Get current user and organization for role-based features
  const [user, organization] = await Promise.all([
    getCurrentUser(),
    getCurrentOrganization(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-6">
          {/* Logo */}
          <div className="flex items-center space-x-2 mr-8">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                MS
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Micro SaaS Starter
            </span>
          </div>

          {/* Organization Switcher */}
          <div className="flex-1">
            <OrganizationSwitcher
              appearance={{
                elements: {
                  organizationSwitcherTrigger:
                    "bg-muted hover:bg-muted/80 text-foreground border-border",
                  organizationSwitcherPopoverCard: "bg-card border-border",
                  organizationSwitcherPopoverActionButton:
                    "text-foreground hover:bg-muted",
                },
              }}
            />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "bg-card border-border",
                  userButtonPopoverActionButton:
                    "text-foreground hover:bg-muted",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card">
          <DashboardNav user={user} organization={organization} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
