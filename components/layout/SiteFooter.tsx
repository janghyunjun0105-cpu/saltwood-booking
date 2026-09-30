import Link from "next/link";
import { Wordmark } from "@/components/layout/Wordmark";
import { MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { DIRECTIONS_URL, RESTAURANT } from "@/lib/restaurant";

const LINK_CLASS = "inline-flex min-h-11 items-center text-ink/80 underline-offset-4 hover:text-ink hover:underline";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-sand/60">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-muted">
            {RESTAURANT.category} on Main Street in downtown {RESTAURANT.city}.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold">Find us</h2>
          <address className="mt-3 flex flex-col items-start not-italic">
            <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              <MapPinIcon className="mr-2 size-5 shrink-0 text-accent-ink" />
              {RESTAURANT.street}, {RESTAURANT.city}, {RESTAURANT.state}
              <span className="sr-only"> (opens Google Maps in a new tab)</span>
            </a>
            <a href={RESTAURANT.phoneHref} className={LINK_CLASS}>
              <PhoneIcon className="mr-2 size-5 shrink-0 text-accent-ink" />
              {RESTAURANT.phoneDisplay}
            </a>
          </address>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-display text-lg font-semibold">Reservations</h2>
          <ul className="mt-3">
            <li>
              <Link href="/book" className={LINK_CLASS}>
                Book a table
              </Link>
            </li>
            <li>
              <Link href="/manage" prefetch={false} className={LINK_CLASS}>
                Change or cancel a booking
              </Link>
            </li>
            <li>
              <Link href="/admin" prefetch={false} className={LINK_CLASS}>
                Staff dashboard (demo)
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-5 text-sm text-muted">
          © {year} {RESTAURANT.name}. A portfolio demo — not a real restaurant.
        </p>
      </div>
    </footer>
  );
}
