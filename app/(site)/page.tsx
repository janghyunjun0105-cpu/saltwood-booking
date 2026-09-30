import type { Metadata } from "next";
import Image from "next/image";
import { HoursCard } from "@/components/home/HoursCard";
import { LocationCard } from "@/components/home/LocationCard";
import { StickyBottomBar } from "@/components/layout/StickyBottomBar";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { ArrowRightIcon, PhoneIcon } from "@/components/ui/icons";
import { RESTAURANT, SIGNATURE_DISHES } from "@/lib/restaurant";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const HIGHLIGHTS = [
  { value: "Post oak", label: "The only fuel in our hearth" },
  { value: "150 mi", label: "The farthest farm we buy from" },
  { value: "48 seats", label: "Plus eight at the bar" },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="container-page grid items-center gap-10 py-10 sm:py-14 md:grid-cols-[1.05fr_1fr] md:gap-12 lg:py-20">
          <div>
            <p className="text-sm font-semibold tracking-[0.14em] text-accent-ink uppercase">
              {RESTAURANT.category} · {RESTAURANT.city}, {RESTAURANT.state}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {RESTAURANT.name}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted sm:text-xl">{RESTAURANT.pitch}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/book" size="lg">
                Book a table
                <ArrowRightIcon className="size-5" />
              </ButtonLink>
              <ButtonLink href="#visit" size="lg" variant="secondary">
                Hours &amp; location
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-muted">
              Parties of 9 or more:{" "}
              <a href={RESTAURANT.phoneHref} className="font-medium text-primary underline underline-offset-4">
                call {RESTAURANT.phoneDisplay}
              </a>
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[26rem] md:max-w-none">
            {/* Illustrations live in /public/art — swap any of them for a real photo later. */}
            <Image
              src="/art/hero-table.svg"
              alt=""
              width={520}
              height={520}
              loading="eager"
              fetchPriority="high"
              className="w-full drop-shadow-sm"
            />
            <p className="absolute bottom-[6%] left-0 rounded-full border border-line bg-surface/95 px-4 py-2 text-sm font-medium shadow-sm sm:left-[4%]">
              <span className="text-accent-ink">Tonight&rsquo;s catch:</span> Gulf redfish
            </p>
          </div>
        </div>
      </section>

      {/* Visit */}
      <section id="visit" aria-labelledby="visit-heading" className="scroll-mt-4 border-t border-line bg-sand/50">
        <div className="container-page py-14 sm:py-20">
          <h2 id="visit-heading" className="font-display text-3xl font-semibold sm:text-4xl">
            Plan your visit
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Walk-ins are welcome at the bar. For the dining room, book ahead — weekends fill up fast.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <HoursCard />
            <LocationCard />
          </div>
        </div>
      </section>

      {/* Signature dishes */}
      <section aria-labelledby="dishes-heading" className="border-t border-line">
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-2xl">
            <h2 id="dishes-heading" className="font-display text-3xl font-semibold sm:text-4xl">
              Three dishes we&rsquo;re known for
            </h2>
            <p className="mt-3 text-muted">
              The menu follows the seasons and changes every few weeks. These three stay on it all year.
            </p>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {SIGNATURE_DISHES.map((dish) => (
              <li key={dish.id} className="overflow-hidden rounded-card border border-line bg-surface">
                <Image src={`/art/dish-${dish.id}.svg`} alt="" width={240} height={160} className="aspect-[3/2] w-full" />
                <div className="p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-xl font-semibold">{dish.name}</h3>
                    <p className="shrink-0 font-medium text-accent-ink">${dish.price}</p>
                  </div>
                  <p className="mt-2 text-muted">{dish.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* About */}
      <section aria-labelledby="about-heading" className="border-t border-line bg-surface">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h2 id="about-heading" className="font-display text-3xl font-semibold sm:text-4xl">
              A neighborhood bistro, cooked over wood
            </h2>
            <div className="mt-5 space-y-4 text-lg text-muted">
              <p>
                Saltwood started with a single hearth and a simple idea: cook what Central Texas grows, keep it
                honest, and make everyone feel like a regular by their second visit.
              </p>
              <p>
                Our kitchen works with a handful of farms, ranches and Gulf fishermen. The wine list is short,
                mostly American, and poured by people who like talking about it.
              </p>
            </div>
          </div>
          <dl className="grid content-start gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {HIGHLIGHTS.map((item) => (
              <div key={item.value} className="rounded-card border border-line bg-background p-5">
                <dt className="text-sm text-muted">{item.label}</dt>
                <dd className="mt-1 font-display text-3xl font-semibold text-primary">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Closing CTA */}
      <section aria-labelledby="cta-heading" className="container-page py-14 sm:py-20">
        <div className="rounded-card bg-primary px-6 py-10 text-center text-white sm:px-12 sm:py-14">
          <h2 id="cta-heading" className="font-display text-3xl font-semibold sm:text-4xl">
            Save your seat
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            Booking takes under a minute. You&rsquo;ll get a confirmation code and a calendar invite right away.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/book" size="lg" variant="inverse">
              Book a table
            </ButtonLink>
            <a href={RESTAURANT.phoneHref} className={buttonClasses({ size: "lg", variant: "inverseGhost" })}>
              <PhoneIcon className="size-5" />
              {RESTAURANT.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <StickyBottomBar>
        <div className="flex gap-3">
          <ButtonLink href="/book" size="lg" className="flex-1">
            Book a table
          </ButtonLink>
          <a href={RESTAURANT.phoneHref} className={buttonClasses({ size: "icon", variant: "secondary" })}>
            <PhoneIcon className="size-5" />
            <span className="sr-only">Call {RESTAURANT.phoneDisplay}</span>
          </a>
        </div>
      </StickyBottomBar>
    </>
  );
}
