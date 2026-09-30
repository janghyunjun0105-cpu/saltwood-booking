import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Step actions. On phones the bar is pinned to the bottom of the screen (thumb reach),
 * clear of the home indicator; from 768px up it sits inline under the step.
 */
export function ActionBar({ children, summary }: { children: ReactNode; summary?: ReactNode }) {
  return (
    <div
      data-sticky-cta
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/95 px-4 pt-3 pb-safe backdrop-blur",
        "md:static md:z-auto md:mt-10 md:border-t md:bg-transparent md:px-0 md:pt-6 md:pb-0 md:backdrop-blur-none",
      )}
    >
      {summary ? <p className="mb-2 truncate text-center text-sm text-muted md:hidden">{summary}</p> : null}
      <div className="flex gap-3 md:justify-between">{children}</div>
    </div>
  );
}
