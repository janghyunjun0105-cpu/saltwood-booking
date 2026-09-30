"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type NavLinkProps = ComponentProps<typeof Link> & { href: string; exact?: boolean };

/** A link that marks itself with aria-current="page" when its route is active. */
export function NavLink({ href, exact = false, className, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-medium text-ink/80 transition-colors hover:bg-sand hover:text-ink aria-[current=page]:text-primary",
        className,
      )}
      {...props}
    />
  );
}
