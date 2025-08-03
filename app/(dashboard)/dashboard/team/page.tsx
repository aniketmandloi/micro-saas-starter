import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamMembersTable } from "@/components/dashboard/team-members-table";
import { InviteMemberDialog } from "@/components/dashboard/invite-member-dialog";
import { Users, UserPlus } from "lucide-react";

export const metadata = {
  title: "Team - Organization Management",
  description: "Manage your organization members and their roles.",
};

export default async function TeamPage() {
  const { userId, orgId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");

  // Get organization and user's role
  const organization = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!organization) {
    redirect("/onboarding");
  }

  const userRole = organization.members[0]?.role;
  const canManageTeam = Boolean(
    userRole && ["OWNER", "ADMIN"].includes(userRole)
  );

  // Get all organization members
  const [members, pendingInvitations] = await Promise.all([
    getOrganizationMembers(orgId),
    getPendingInvitations(orgId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your organization members and their roles.
          </p>
        </div>
        {canManageTeam && (
          <InviteMemberDialog>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </InviteMemberDialog>
        )}
      </div>

      {/* Team Members */}
      <Suspense fallback={<TeamMembersSkeletonLoader />}>
        <TeamMembersTable
          members={members}
          userRole={userRole}
          canManageTeam={canManageTeam}
        />
      </Suspense>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Members who have been invited but haven&apos;t joined yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited {formatRelativeTime(invitation.invitedAt!)} •{" "}
                      {invitation.role}
                    </p>
                  </div>
                  {canManageTeam && (
                    <Button variant="outline" size="sm">
                      Resend
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ================================
// Data Fetching Functions
// ================================

async function getOrganizationMembers(organizationId: string) {
  return db.organizationMember.findMany({
    where: {
      organizationId,
      joinedAt: { not: null }, // Only show joined members
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [
      { role: "asc" }, // OWNER first, then ADMIN, etc.
      { joinedAt: "asc" },
    ],
  });
}

async function getPendingInvitations(organizationId: string) {
  return db.organizationMember
    .findMany({
      where: {
        organizationId,
        joinedAt: null,
        invitedAt: { not: null },
      },
      select: {
        id: true,
        userId: true, // This will contain the email for pending invitations
        role: true,
        invitedAt: true,
      },
    })
    .then((invitations) =>
      invitations.map((inv) => ({
        ...inv,
        email: inv.userId, // userId contains email for pending invitations
      }))
    );
}

// ================================
// Loading Components
// ================================

function TeamMembersSkeletonLoader() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-48 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Helper Functions
// ================================

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
