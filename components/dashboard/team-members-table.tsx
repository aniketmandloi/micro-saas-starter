"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Crown, Shield, User, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  updateMemberRole,
  removeMemberFromOrganization,
} from "@/server/actions/organizations";

interface TeamMember {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: Date | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
  };
}

interface TeamMembersTableProps {
  members: TeamMember[];
  userRole?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" | undefined;
  canManageTeam: boolean;
}

export function TeamMembersTable({
  members,
  userRole,
  canManageTeam,
}: TeamMembersTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const handleRoleChange = async (
    memberId: string,
    newRole: "ADMIN" | "MEMBER" | "VIEWER"
  ) => {
    if (!canManageTeam) return;

    setIsLoading(memberId);
    try {
      const result = await updateMemberRole({ memberId, role: newRole });

      if (result.success) {
        toast.success("Member role updated successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update member role");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!canManageTeam || !memberToRemove) return;

    setIsLoading(memberToRemove.id);
    try {
      const result = await removeMemberFromOrganization({
        memberId: memberToRemove.id,
      });

      if (result.success) {
        toast.success("Member removed successfully");
        router.refresh();
        setMemberToRemove(null);
      } else {
        toast.error(result.error || "Failed to remove member");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "MEMBER":
        return <User className="h-4 w-4 text-green-500" />;
      case "VIEWER":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default" as const;
      case "ADMIN":
        return "secondary" as const;
      case "MEMBER":
        return "outline" as const;
      case "VIEWER":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  const getDisplayName = (member: TeamMember) => {
    const fullName =
      `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim();
    return fullName || member.user.email;
  };

  const canEditRole = (member: TeamMember) => {
    if (!canManageTeam) return false;
    if (member.role === "OWNER") return false;
    if (userRole !== "OWNER" && member.role === "ADMIN") return false;
    return true;
  };

  const canRemoveMember = (member: TeamMember) => {
    if (!canManageTeam) return false;
    if (member.role === "OWNER") return false;
    return true;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in your
            organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const isCurrentlyLoading = isLoading === member.id;
              const displayName = getDisplayName(member);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.user.imageUrl || undefined} />
                      <AvatarFallback>
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                      {member.joinedAt && (
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Role Display/Editor */}
                    {canEditRole(member) ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(
                            member.id,
                            value as "ADMIN" | "MEMBER" | "VIEWER"
                          )
                        }
                        disabled={isCurrentlyLoading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {userRole === "OWNER" && (
                            <SelectItem value="ADMIN">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                Admin
                              </div>
                            </SelectItem>
                          )}
                          <SelectItem value="MEMBER">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-green-500" />
                              Member
                            </div>
                          </SelectItem>
                          <SelectItem value="VIEWER">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-gray-500" />
                              Viewer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </div>
                      </Badge>
                    )}

                    {/* Actions Menu */}
                    {canRemoveMember(member) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={isCurrentlyLoading}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setMemberToRemove(member)}
                          >
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No team members found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {memberToRemove && getDisplayName(memberToRemove)}
              </strong>{" "}
              from your organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
