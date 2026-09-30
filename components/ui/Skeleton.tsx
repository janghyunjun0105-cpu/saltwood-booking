import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-line/70", className)} />;
}

/** A labelled loading block for screen readers, with visual placeholder bars. */
export function LoadingCard({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("rounded-card border border-line bg-surface p-6", className)}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="mt-5 h-4 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    </div>
  );
}
