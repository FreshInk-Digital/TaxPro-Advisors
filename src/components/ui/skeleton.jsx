// File: src/components/ui/skeleton.jsx
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

// --------------------------------------------------------------------------
// Composite Skeleton loaders for common UI patterns
// --------------------------------------------------------------------------

/** Card grid skeleton — pass count for number of cards */
export function SkeletonCard({ count = 3 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Table skeleton */
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/50 px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border last:border-0 px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Form skeleton */
export function SkeletonForm({ fields = 4 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}

/** Poster grid skeleton */
export function SkeletonPosters({ count = 8 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-10 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-8 w-full rounded-lg mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stat bar skeleton */
export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted p-6 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Hero skeleton */
export function SkeletonHero() {
  return (
    <div className="py-20 md:py-28">
      <div className="container grid gap-12 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-5/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-3">
            <Skeleton className="h-11 w-36 rounded-lg" />
            <Skeleton className="h-11 w-32 rounded-lg" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Admin dashboard stats skeleton */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-52" />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
