import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#1a1a1a",
          colorInputText: "#fafafa",
        },
        elements: {
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground",
          card: "bg-card",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "bg-muted hover:bg-muted/80 text-foreground border-border",
          formFieldLabel: "text-foreground",
          formFieldInput:
            "bg-background border-border text-foreground focus:border-primary",
          footerActionLink: "text-primary hover:text-primary/80",
        },
      }}
    >
      <div className="min-h-screen flex">
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/20 via-primary/5 to-background">
          <div className="flex flex-col justify-center px-8 xl:px-12">
            <div className="mx-auto max-w-md">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    MS
                  </span>
                </div>
                <span className="text-xl font-bold text-foreground">
                  Micro SaaS Starter
                </span>
              </Link>

              {/* Feature Highlights */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Everything you need to build a SaaS
                </h2>
                <p className="text-muted-foreground">
                  A complete starter kit with authentication, billing,
                  analytics, and all the essential features for your next
                  micro-SaaS product.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">
                      Multi-tenant organization support
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">
                      Role-based access control
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">
                      Integrated billing & subscriptions
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <span className="text-sm text-foreground">
                      Analytics & monitoring dashboard
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Built with Next.js, TypeScript, Prisma, and the latest web
                  technologies
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Authentication Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
              <Link
                href="/"
                className="flex items-center justify-center space-x-2"
              >
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    MS
                  </span>
                </div>
                <span className="text-xl font-bold text-foreground">
                  Micro SaaS Starter
                </span>
              </Link>
            </div>

            {/* Auth Form Content */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              {children}
            </div>

            {/* Footer Links */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-primary hover:text-primary/80 underline underline-offset-4"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-primary hover:text-primary/80 underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClerkProvider>
  );
}
