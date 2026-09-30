import { ButtonLink } from "@/components/ui/Button";
import { NavLink } from "@/components/layout/NavLink";
import { Wordmark } from "@/components/layout/Wordmark";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Wordmark className="-ml-1 px-1" />
        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            <li className="hidden sm:block">
              <NavLink href="/#visit" exact prefetch={false}>
                Visit
              </NavLink>
            </li>
            <li>
              {/* Only the main call to action is prefetched, to keep work off the main thread during load. */}
              <NavLink href="/manage" prefetch={false}>
                Manage<span className="hidden sm:inline">&nbsp;booking</span>
              </NavLink>
            </li>
            <li className="ml-2 hidden md:block">
              <ButtonLink href="/book" size="sm">
                Book a table
              </ButtonLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
