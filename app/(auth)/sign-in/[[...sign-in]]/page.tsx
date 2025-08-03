import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Micro SaaS Starter",
  description:
    "Sign in to your account to access your dashboard and manage your projects.",
};

export default function SignInPage() {
  return (
    <div className="flex flex-col space-y-4">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <SignIn
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
          },
        }}
        redirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
