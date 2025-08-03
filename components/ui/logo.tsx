"use client";

import { cn } from "@/lib/utils";
import { Monitor } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Monitor className="h-5 w-5 text-primary-foreground" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-none">SaaS Starter</span>
          <span className="text-xs text-muted-foreground leading-none">Monitor & Scale</span>
        </div>
      )}
    </div>
  );
}