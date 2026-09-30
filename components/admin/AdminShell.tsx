"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { NavLink } from "@/components/layout/NavLink";
import { Wordmark } from "@/components/layout/Wordmark";
import { ExternalLinkIcon, ListIcon, LogOutIcon, SlidersIcon } from "@/components/ui/icons";
import { LoadingCard } from "@/components/ui/Skeleton";
import { signOutAdmin } from "@/lib/adminSession";
import { useAdminSession } from "@/lib/hooks/useAdminSession";

/**
 * Staff chrome plus a client-side guard. Demo only: the guard is a UX gate,
 * not access control — see lib/adminSession.ts.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const signedIn = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (signedIn === false) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [signedIn, pathname, router]);

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
          <div className="flex items-center gap-2">
            <Wordmark href="/admin" />
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-background">Staff</span>
          </div>
          <nav aria-label="Staff" className="-mx-2 flex items-center gap-1 whitespace-nowrap">
            <NavLink href="/admin" exact>
              <ListIcon className="mr-1.5 size-4" />
              Bookings
            </NavLink>
            <NavLink href="/admin/settings">
              <SlidersIcon className="mr-1.5 size-4" />
              Settings
            </NavLink>
            <span className="hidden sm:contents">
              <NavLink href="/" exact>
                <ExternalLinkIcon className="mr-1.5 size-4" />
                View site
              </NavLink>
            </span>
            <button
              type="button"
              onClick={() => {
                signOutAdmin();
                router.replace("/admin/login");
              }}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-[15px] font-medium text-ink/80 hover:bg-sand hover:text-ink"
            >
              <LogOutIcon className="size-4 sm:mr-1.5" />
              <span className="sr-only sm:not-sr-only">Sign out</span>
            </button>
          </nav>
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {signedIn ? (
          children
        ) : (
          <div className="container-page mt-10">
            <LoadingCard label="Checking your session…" />
          </div>
        )}
      </main>
    </>
  );
}
