import Image from "next/image";
import { buttonClasses } from "@/components/ui/Button";
import { ExternalLinkIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { DIRECTIONS_URL, RESTAURANT } from "@/lib/restaurant";

export function LocationCard() {
  return (
    <section aria-labelledby="location-heading" className="overflow-hidden rounded-card border border-line bg-surface">
      <Image src="/art/map-main-st.svg" alt="" width={400} height={220} className="h-40 w-full object-cover sm:h-48" />
      <div className="p-6 sm:p-8">
        <h3 id="location-heading" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <MapPinIcon className="size-6 text-accent-ink" />
          Location
        </h3>
        <address className="mt-4 text-lg not-italic">
          {RESTAURANT.street}
          <br />
          {RESTAURANT.city}, {RESTAURANT.state} {RESTAURANT.postalCode}
        </address>
        <p className="mt-2 text-muted">Street parking on Main St and a public garage one block east.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary" })}>
            <ExternalLinkIcon className="size-5" />
            Get directions
            <span className="sr-only">(opens Google Maps in a new tab)</span>
          </a>
          <a href={RESTAURANT.phoneHref} className={buttonClasses({ variant: "ghost" })}>
            <PhoneIcon className="size-5" />
            {RESTAURANT.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
