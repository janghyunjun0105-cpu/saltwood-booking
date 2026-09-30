"use client";

import { useRouter } from "next/navigation";
import { AddToCalendarButton, CopyCodeButton } from "@/components/booking/BookingActions";
import { BookingDetails, BookingHeadline } from "@/components/booking/BookingDetails";
import { LookupForm } from "@/components/manage/LookupForm";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { CheckIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { LoadingCard } from "@/components/ui/Skeleton";
import { useRepoQuery } from "@/lib/hooks/useRepoQuery";
import { DIRECTIONS_URL, RESTAURANT } from "@/lib/restaurant";

export function ConfirmationView({ code }: { code: string }) {
  const router = useRouter();
  const { data: booking, isLoading, error } = useRepoQuery(`booking:${code}`, (repo) => repo.getBookingByCode(code));

  if (error) {
    return (
      <Notice tone="danger" title="We couldn't load this booking" role="alert">
        Refresh the page to try again.
      </Notice>
    );
  }

  if (isLoading && booking === undefined) {
    return <LoadingCard label="Loading your booking…" className="mx-auto min-h-[40rem] max-w-2xl" />;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">We couldn&rsquo;t find that booking</h1>
        <p className="mt-3 text-muted">
          There&rsquo;s no booking with the code <span className="font-semibold text-ink">{code}</span> in this browser.
          Bookings in this demo live in the browser they were made in. Look one up with your code and email:
        </p>
        <div className="mt-8 rounded-card border border-line bg-surface p-6">
          <LookupForm onFound={(found) => router.replace(`/book/confirmation/${found.code}`)} />
        </div>
      </div>
    );
  }

  const cancelled = booking.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        {cancelled ? null : (
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success motion-safe:animate-step-in">
            <CheckIcon className="size-7" strokeWidth={2.5} />
          </span>
        )}
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {cancelled ? "This booking was cancelled" : `You’re booked, ${booking.firstName}!`}
        </h1>
        <p className="mt-3 text-muted">
          {cancelled
            ? "The table has been released. We'd love to see you another time."
            : "Your table is saved. Keep your booking code handy — you’ll need it to make changes."}
        </p>
      </div>

      <section aria-labelledby="summary-heading" className="mt-8 rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <h2 id="summary-heading" className="text-sm text-muted">
            Booking code
            <span className="mt-0.5 block font-display text-3xl font-semibold tracking-wider text-ink">{booking.code}</span>
          </h2>
          <CopyCodeButton code={booking.code} />
        </div>
        <div className="p-6">
          <div className={cancelled ? "opacity-60" : undefined}>
            <BookingHeadline date={booking.date} time={booking.time} partySize={booking.partySize} />
          </div>
          <div className="mt-4">
            <BookingDetails booking={booking} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {cancelled ? (
          <ButtonLink href="/book" size="lg" className="sm:col-span-3">
            Book another table
          </ButtonLink>
        ) : (
          <>
            <AddToCalendarButton booking={booking} />
            <ButtonLink href={`/manage?code=${booking.code}`} variant="secondary" size="lg">
              Manage booking
            </ButtonLink>
            <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary", size: "lg" })}>
              <ExternalLinkIcon className="size-5" />
              Get directions
              <span className="sr-only">(opens Google Maps in a new tab)</span>
            </a>
          </>
        )}
      </div>

      {cancelled ? null : (
        <section aria-labelledby="know-heading" className="mt-10 rounded-card bg-sand/70 p-6">
          <h2 id="know-heading" className="font-display text-lg font-semibold">
            Good to know
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted marker:text-accent">
            <li>We hold tables for 15 minutes past the booking time.</li>
            <li>Street parking on Main St, plus a public garage one block east.</li>
            <li>
              Running late or need to add guests? Call us at{" "}
              <a href={RESTAURANT.phoneHref} className="font-medium text-primary underline underline-offset-2">
                {RESTAURANT.phoneDisplay}
              </a>
              .
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
