import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "@/components/auth/create-organization-form";
import { db } from "@/lib/db";

export const metadata = {
  title: "Welcome - Get Started",
  description:
    "Create your organization to get started with your micro-SaaS journey.",
};

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user already has an organization
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      organizationMembers: {
        include: {
          organization: true,
        },
      },
    },
  });

  // If user has organizations, redirect to dashboard
  if (user?.organizationMembers.length) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Micro SaaS Starter! 🎉
          </h1>
          <p className="mt-3 text-muted-foreground">
            Let&apos;s create your organization to get you started
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <CreateOrganizationForm />
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can always create additional organizations later
          </p>
        </div>
      </div>
    </div>
  );
}
