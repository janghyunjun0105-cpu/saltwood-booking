import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Fixed bar for the main action on phones. Hidden from 768px up.
 * `data-sticky-cta` tells globals.css to pad the page so the footer isn't covered,
 * and pb-safe keeps the button clear of the iOS home indicator.
 */
export function StickyBottomBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-sticky-cta
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/95 px-4 pt-3 pb-safe backdrop-blur md:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
