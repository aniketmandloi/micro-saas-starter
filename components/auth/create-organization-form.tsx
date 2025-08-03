"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizationList, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

export function CreateOrganizationForm() {
  const router = useRouter();
  const { createOrganization } = useOrganizationList();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
  });

  // Auto-generate slug from name
  const watchName = watch("name");
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const onSubmit = async (data: CreateOrganizationFormData) => {
    if (!createOrganization) {
      toast.error("Organization creation is not available");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create organization in Clerk
      const organization = await createOrganization({
        name: data.name,
        slug: data.slug,
      });

      if (organization) {
        // Create organization in database via server action
        const response = await fetch("/api/organizations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerkId: organization.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
          }),
        });

        if (response.ok) {
          toast.success("Organization created successfully!");
          router.push("/dashboard");
        } else {
          const error = await response.text();
          toast.error(error || "Failed to create organization");
        }
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-foreground">
            Organization Name *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Acme Corporation"
            className="mt-1"
            {...register("name", {
              onChange: (e) => {
                const slug = generateSlug(e.target.value);
                setValue("slug", slug);
              },
            })}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="slug" className="text-foreground">
            Organization Slug *
          </Label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm">
              your-domain.com/
            </span>
            <Input
              id="slug"
              type="text"
              placeholder="acme-corp"
              className="rounded-l-none"
              {...register("slug")}
            />
          </div>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            This will be used in your organization's URL and cannot be changed
            later.
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="text-foreground">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Tell us about your organization..."
            className="mt-1"
            rows={3}
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Creating Organization..." : "Create Organization"}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Creating an organization will make you the owner with full access to
          all features.
        </p>
      </div>
    </form>
  );
}
