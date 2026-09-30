"use client";

import { useEffect, useRef, useState } from "react";
import { AddToCalendarButton } from "@/components/booking/BookingActions";
import { BookingDetails, BookingHeadline } from "@/components/booking/BookingDetails";
import { LookupForm } from "@/components/manage/LookupForm";
import { RescheduleForm } from "@/components/manage/RescheduleForm";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CalendarIcon, ChevronLeftIcon, XIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { LoadingCard } from "@/components/ui/Skeleton";
import { StatusChip } from "@/components/ui/StatusChip";
import { isSlotTooSoon } from "@/lib/availability";
import { useRepoQuery } from "@/lib/hooks/useRepoQuery";
import { useRestaurantNow } from "@/lib/hooks/useRestaurantNow";
import { RESTAURANT } from "@/lib/restaurant";
import type { Booking } from "@/lib/schemas";
import { withRepo } from "@/lib/storage/lazy";
import { formatDateShort, formatPartySize, formatTime } from "@/lib/time";

type Mode = "view" | "reschedule";

export function ManageView() {
  const [code, setCode] = useState<string | null>(null);

  if (!code) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Manage your booking</h1>
        <p className="mt-3 text-muted">
          Enter your booking code and the email you booked with to change the date, time or party size, or to cancel.
        </p>
        <div className="mt-8 rounded-card border border-line bg-surface p-6">
          <LookupForm prefillFromUrl onFound={(booking) => setCode(booking.code)} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Lost your code? Call us at{" "}
          <a href={RESTAURANT.phoneHref} className="font-medium text-primary underline underline-offset-2">
            {RESTAURANT.phoneDisplay}
          </a>
          .
        </p>
      </div>
    );
  }

  return <FoundBooking code={code} onLookUpAnother={() => setCode(null)} />;
}

function FoundBooking({ code, onLookUpAnother }: { code: string; onLookUpAnother: () => void }) {
  // Re-read on every change so staff updates or other tabs show up here too.
  const { data: booking, isLoading } = useRepoQuery(`manage:${code}`, (repo) => repo.getBookingByCode(code));
  const now = useRestaurantNow();
  const [mode, setMode] = useState<Mode>("view");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Bring the success message into view after a change.
  useEffect(() => {
    if (message) messageRef.current?.scrollIntoView({ block: "center" });
  }, [message]);

  if (isLoading && booking === undefined) return <LoadingCard label="Loading your booking…" />;

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg">
        <Notice tone="warning" title="This booking is no longer available" role="alert">
          It may have been removed when the demo data was reset.
        </Notice>
        <Button className="mt-6" onClick={onLookUpAnother}>
          Look up another booking
        </Button>
      </div>
    );
  }

  const tooLate = now ? isSlotTooSoon(booking.date, booking.time, now) : false;
  const editable = booking.status === "confirmed" && !tooLate;

  if (mode === "reschedule" && editable) {
    return (
      <div className="mx-auto max-w-3xl md:rounded-card md:border md:border-line md:bg-surface md:p-8">
        <RescheduleForm
          booking={booking}
          onCancel={() => setMode("view")}
          onSaved={(updated: Booking) => {
            setMode("view");
            setMessage(
              `Done — your table is now ${formatDateShort(updated.date)} at ${formatTime(updated.time)} for ${formatPartySize(updated.partySize)}.`,
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onLookUpAnother}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeftIcon className="size-4" />
        Look up another booking
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your booking</h1>
        <StatusChip status={booking.status} />
      </div>

      <div ref={messageRef} aria-live="polite" className="scroll-mt-24">
        {message ? (
          <Notice tone="success" className="mt-6 animate-step-in">
            {message}
          </Notice>
        ) : null}
      </div>

      <section aria-label="Booking details" className="mt-6 rounded-card border border-line bg-surface">
        <div className="border-b border-line px-6 py-4">
          <p className="text-sm text-muted">Booking code</p>
          <p className="font-display text-2xl font-semibold tracking-wider">{booking.code}</p>
        </div>
        <div className="p-6">
          <div className={booking.status === "cancelled" ? "opacity-60" : undefined}>
            <BookingHeadline date={booking.date} time={booking.time} partySize={booking.partySize} />
          </div>
          <div className="mt-4">
            <BookingDetails booking={booking} />
          </div>
        </div>
      </section>

      {editable ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button
            size="lg"
            onClick={() => {
              setMessage(null);
              setMode("reschedule");
            }}
          >
            <CalendarIcon className="size-5" />
            Change
          </Button>
          <AddToCalendarButton booking={booking} variant="secondary" />
          <Button size="lg" variant="dangerOutline" onClick={() => setConfirmCancel(true)}>
            <XIcon className="size-5" />
            Cancel booking
          </Button>
        </div>
      ) : (
        <Notice className="mt-6" title={lockedTitle(booking.status)}>
          {booking.status === "cancelled" ? (
            <>
              The table has been released. We&rsquo;d love to see you another time.
            </>
          ) : (
            <>
              Online changes close 30 minutes before your booking. Please call us at{" "}
              <a href={RESTAURANT.phoneHref} className="font-medium text-primary underline underline-offset-2">
                {RESTAURANT.phoneDisplay}
              </a>
              .
            </>
          )}
        </Notice>
      )}

      {booking.status === "cancelled" ? (
        <ButtonLink href="/book" size="lg" className="mt-6">
          Book a table
        </ButtonLink>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this booking?"
        description={
          <>
            {formatDateShort(booking.date)} at {formatTime(booking.time)} for {formatPartySize(booking.partySize)}. Your
            table will be released for other guests. This can&rsquo;t be undone online.
          </>
        }
        confirmLabel="Cancel booking"
        pendingLabel="Cancelling…"
        cancelLabel="Keep booking"
        tone="danger"
        onConfirm={async () => {
          await withRepo((repo) => repo.cancelBooking(booking.id));
          setMessage("Your booking has been cancelled. The table is free for someone else now.");
        }}
      />
    </div>
  );
}

function lockedTitle(status: Booking["status"]): string {
  switch (status) {
    case "cancelled":
      return "This booking was cancelled";
    case "seated":
      return "You've been seated — enjoy your meal";
    case "completed":
      return "This visit is complete. Thanks for dining with us!";
    case "no_show":
      return "This booking was marked as a no-show";
    default:
      return "This booking can no longer be changed online";
  }
}
