import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Micro SaaS Starter - Build Your Next SaaS Product",
  description:
    "A complete Next.js starter kit with authentication, billing, analytics, and everything you need to launch your micro-SaaS product.",
  keywords: [
    "SaaS",
    "starter kit",
    "Next.js",
    "TypeScript",
    "Prisma",
    "Clerk",
    "Polar",
  ],
  authors: [{ name: "Micro SaaS Starter" }],
  openGraph: {
    title: "Micro SaaS Starter",
    description: "Build your next SaaS product with our complete starter kit",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Micro SaaS Starter",
    description: "Build your next SaaS product with our complete starter kit",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
