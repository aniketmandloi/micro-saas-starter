import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Micro SaaS Starter",
  description:
    "Create your account to start building amazing SaaS products with our starter kit.",
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col space-y-4">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Create your account
        </h1>
        <p className="text-muted-foreground">
          Get started with your micro-SaaS journey today
        </p>
      </div>

      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-transparent shadow-none border-0 p-0",
            header: "hidden",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "bg-muted hover:bg-muted/80 text-foreground border-border",
            formButtonPrimary:
              "bg-primary hover:bg-primary/90 text-primary-foreground",
            formFieldLabel: "text-foreground",
            formFieldInput:
              "bg-background border-border text-foreground focus:border-primary",
            footerActionLink: "text-primary hover:text-primary/80",
            identityPreviewText: "text-foreground",
            identityPreviewEditButton: "text-primary hover:text-primary/80",
            formResendCodeLink: "text-primary hover:text-primary/80",
            otpCodeFieldInput:
              "bg-background border-border text-foreground focus:border-primary",
            formFieldSuccessText: "text-green-500",
            formFieldErrorText: "text-red-500",
            alertText: "text-foreground",
            formFieldHintText: "text-muted-foreground",
            footerPages: "hidden", // Hide the bottom links to reduce clutter
          },
        }}
        redirectUrl="/onboarding"
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
      />

      {/* Additional signup benefits */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            What you get with your account:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Team collaboration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>API access</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Analytics dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
