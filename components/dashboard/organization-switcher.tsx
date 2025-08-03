"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function OrganizationSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { organization: currentOrg } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList();

  const handleOrganizationSwitch = async (organizationId: string) => {
    if (!setActive) return;

    try {
      await setActive({ organization: organizationId });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  const handleCreateOrganization = () => {
    setOpen(false);
    router.push("/onboarding");
  };

  if (!currentOrg) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentOrg.imageUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {currentOrg.name?.charAt(0).toUpperCase() || "O"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{currentOrg.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {userMemberships?.data?.map((membership) => {
                const isSelected = membership.organization.id === currentOrg.id;

                return (
                  <CommandItem
                    key={membership.organization.id}
                    value={membership.organization.name || ""}
                    onSelect={() =>
                      handleOrganizationSwitch(membership.organization.id)
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={membership.organization.imageUrl} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {membership.organization.name
                            ?.charAt(0)
                            .toUpperCase() || "O"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <div className="truncate font-medium">
                          {membership.organization.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {membership.role.toLowerCase()}
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateOrganization}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 text-primary">
                  <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-primary">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Create Organization</span>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
