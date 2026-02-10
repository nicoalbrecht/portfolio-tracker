"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioSummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

export function HoldingsTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AllocationChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-8">
        <Skeleton className="h-40 w-40 rounded-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PerformanceChartSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

export function PriceChartSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-9 w-32" />
        <div className="text-right space-y-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="mt-2 pt-2 border-t flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function WatchlistSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
