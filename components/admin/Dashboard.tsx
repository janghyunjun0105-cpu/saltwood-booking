"use client";

import { useEffect, useId, useState } from "react";
import { BookingList } from "@/components/admin/BookingList";
import { DateSwitcher } from "@/components/admin/DateSwitcher";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputClasses } from "@/components/ui/Field";
import { SearchIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { LoadingCard } from "@/components/ui/Skeleton";
import { getDateClosure, holdsTable } from "@/lib/availability";
import { cn } from "@/lib/cn";
import { useRepoQuery } from "@/lib/hooks/useRepoQuery";
import { useRestaurantNow } from "@/lib/hooks/useRestaurantNow";
import { useSettings } from "@/lib/hooks/useSettings";
import { BOOKING_STATUSES, STATUS_LABELS, type BookingStatus } from "@/lib/constants";
import type { Booking } from "@/lib/schemas";
import { withRepo } from "@/lib/storage/lazy";
import { WEEKDAY_NAMES, addDaysToDateKey, formatDateLong, formatTime, weekdayOf, type DateKey } from "@/lib/time";

type StatusFilter = BookingStatus | "all";

const PAST_TENSE: Record<BookingStatus, string> = {
  confirmed: "confirmed",
  seated: "seated",
  completed: "completed",
  no_show: "a no-show",
  cancelled: "cancelled",
};

/** The table row or card for a booking, whichever layout is showing. */
function visibleRows(bookingId: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-booking-id="${bookingId}"]`)).filter(
    (row) => row.getClientRects().length > 0,
  );
}

function matchesQuery(booking: Booking, query: string): boolean {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const digits = text.replace(/\D/g, "");
  const name = `${booking.firstName} ${booking.lastName}`.toLowerCase();
  return (
    name.includes(text) ||
    booking.code.toLowerCase().includes(text.replace(/\s/g, "")) ||
    (digits.length >= 3 && booking.phone.includes(digits))
  );
}

export function Dashboard() {
  const now = useRestaurantNow();
  const { settings } = useSettings();
  const [pickedDate, setPickedDate] = useState<DateKey | null>(null);
  const date = pickedDate ?? now?.date ?? null;

  const { data: bookings } = useRepoQuery(`admin-day:${date}`, (repo) =>
    date ? repo.listBookingsForDate(date) : Promise.resolve<Booking[]>([]),
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [changed, setChanged] = useState<{ id: string; key: number; refocus: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const searchId = useId();
  const statusId = useId();

  // After a status change: briefly highlight the row so staff see what moved, and keep keyboard
  // focus in that row (the button that was pressed is replaced by the next set of actions).
  useEffect(() => {
    if (!changed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const row of visibleRows(changed.id)) {
      row.animate([{ backgroundColor: "var(--color-accent-soft)" }, { backgroundColor: "transparent" }], {
        duration: 1200,
        easing: "ease-out",
      });
    }
  }, [changed]);

  // Runs again when the reloaded bookings arrive, because that render swaps the row's buttons.
  useEffect(() => {
    if (!changed?.refocus) return;
    const row = visibleRows(changed.id)[0];
    if (row && !row.contains(document.activeElement)) {
      row.querySelector<HTMLElement>("button:not([disabled])")?.focus();
    }
  }, [changed, bookings]);

  if (!now || !date || !bookings) {
    return (
      <div className="container-page py-8">
        <LoadingCard label="Loading bookings…" />
      </div>
    );
  }

  const active = bookings.filter(holdsTable);
  const stats = [
    { label: "Bookings", value: active.length },
    { label: "Guests", value: active.reduce((sum, booking) => sum + booking.partySize, 0) },
    { label: "Seated", value: bookings.filter((booking) => booking.status === "seated").length },
    { label: "No-shows", value: bookings.filter((booking) => booking.status === "no_show").length },
  ];
  const visible = bookings.filter(
    (booking) => (status === "all" || booking.status === status) && matchesQuery(booking, query),
  );
  const closure = getDateClosure(settings, date);
  const filtered = query.trim() !== "" || status !== "all";

  async function changeStatus(booking: Booking, next: BookingStatus) {
    const active = document.activeElement;
    const refocus = active instanceof HTMLElement && active.closest(`[data-booking-id="${booking.id}"]`) !== null;
    setBusyId(booking.id);
    setError(null);
    try {
      await withRepo((repo) => repo.setBookingStatus(booking.id, next));
      setChanged({ id: booking.id, key: Date.now(), refocus });
      setAnnouncement(
        `${booking.firstName} ${booking.lastName} at ${formatTime(booking.time)} marked ${PAST_TENSE[next]}.`,
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "That change didn't save.";
      setError(
        next === "confirmed" && booking.status === "cancelled"
          ? `Can't restore ${booking.firstName} ${booking.lastName}: every table at ${formatTime(booking.time)} is taken.`
          : message,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{date === now.date ? "Today" : WEEKDAY_NAMES[weekdayOf(date)]}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{formatDateLong(date)}</h1>
        </div>
        <DateSwitcher
          date={date}
          today={now.date}
          onChange={(next) => {
            setPickedDate(next);
            setError(null);
          }}
        />
      </div>

      {closure ? (
        <Notice tone="warning" className="mt-6" title={closure === "blackout" ? "Blackout date" : "Closed"}>
          {closure === "blackout"
            ? "Guests can't book this date. Remove it under Settings → Blackout dates to reopen."
            : `The restaurant is closed on ${WEEKDAY_NAMES[weekdayOf(date)]}s. Change this under Settings → Opening hours.`}
        </Notice>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-line bg-surface p-4 sm:p-5">
            <dt className="text-sm text-muted">{stat.label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search by name, phone or code
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone or code"
            autoComplete="off"
            className={cn(inputClasses, "pl-11")}
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor={statusId} className="sr-only">
            Filter by status
          </label>
          <select
            id={statusId}
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className={inputClasses}
          >
            <option value="all">All statuses</option>
            {BOOKING_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {filtered
            ? `Showing ${visible.length} of ${bookings.length} ${bookings.length === 1 ? "booking" : "bookings"}`
            : `${bookings.length} ${bookings.length === 1 ? "booking" : "bookings"}`}
        </p>
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <div aria-live="assertive">
        {error ? (
          <Notice tone="danger" role="alert" className="mb-4">
            {error}
          </Notice>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {visible.length > 0 ? (
        <BookingList
          bookings={visible}
          busyId={busyId}
          onChange={changeStatus}
          onRequestCancel={setCancelTarget}
        />
      ) : (
        <div className="rounded-card border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">
            {bookings.length === 0 ? "No bookings for this date yet" : "No bookings match"}
          </p>
          <p className="mt-1 text-muted">
            {bookings.length === 0 ? "New online bookings will show up here right away." : "Try a different search or status."}
          </p>
          {bookings.length === 0 && date === now.date && closure ? (
            <Button variant="secondary" className="mt-5" onClick={() => setPickedDate(addDaysToDateKey(date, 1))}>
              Go to tomorrow
            </Button>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Cancel this booking?"
        description={
          cancelTarget
            ? `${cancelTarget.firstName} ${cancelTarget.lastName}, ${formatTime(cancelTarget.time)}, party of ${cancelTarget.partySize}. The table goes back on sale right away.`
            : ""
        }
        confirmLabel="Cancel booking"
        pendingLabel="Cancelling…"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={async () => {
          if (cancelTarget) await changeStatus(cancelTarget, "cancelled");
        }}
      />
    </div>
  );
}
