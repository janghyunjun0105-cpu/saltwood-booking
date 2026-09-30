import Link from "next/link";
import { cn } from "@/lib/cn";

export function Wordmark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex min-h-11 items-center gap-2 rounded-md font-display text-xl font-semibold tracking-tight", className)}
    >
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M20.8 10.6c-1-1.2-2.6-1.9-4.5-1.9-2.8 0-4.8 1.5-4.8 3.7 0 4.9 9.6 3 9.6 7.4 0 1.8-1.8 3.1-4.4 3.1-2 0-3.8-.8-4.9-2.3"
          fill="none"
          stroke="#f6f2eb"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="23.5" cy="8.5" r="1.8" className="fill-accent" />
      </svg>
      <span>
        Saltwood <span className="text-accent-ink">Kitchen</span>
      </span>
    </Link>
  );
}
