"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center", className)}>
      <div className="mb-4 text-muted-foreground/60">{icon}</div>
      <p className="text-muted-foreground font-medium mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground/80 mb-4 max-w-[200px]">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function PortfolioIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-12 w-12", className)}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="10" width="36" height="28" rx="2" />
      <path d="M6 18h36" />
      <path d="M14 26h6" />
      <path d="M14 32h10" />
      <circle cx="34" cy="29" r="5" />
    </svg>
  );
}

export function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-12 w-12", className)}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 38h36" />
      <path d="M10 38V22" />
      <path d="M18 38V14" />
      <path d="M26 38V26" />
      <path d="M34 38V10" />
      <path d="M42 38V18" />
    </svg>
  );
}

export function PieChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-12 w-12", className)}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="24" r="16" />
      <path d="M24 8v16l11.3 11.3" />
      <path d="M24 24L12.7 35.3" />
    </svg>
  );
}

export function WatchlistIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-12 w-12", className)}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="24" r="16" />
      <path d="M24 14v10l6 4" />
      <path d="M16 8l-4-4" />
      <path d="M32 8l4-4" />
    </svg>
  );
}

export function TrendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-12 w-12", className)}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 38L18 26l8 8 16-20" />
      <path d="M32 14h10v10" />
    </svg>
  );
}
