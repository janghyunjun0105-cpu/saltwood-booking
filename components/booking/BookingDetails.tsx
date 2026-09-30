import type { ReactNode } from "react";
import { CalendarIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { OCCASION_LABELS } from "@/lib/constants";
import type { Booking } from "@/lib/schemas";
import { formatDateLong, formatPartySize, formatTime, formatUsPhone } from "@/lib/time";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** The when/who headline: date, time and party size with icons. */
export function BookingHeadline({ date, time, partySize }: Pick<Booking, "date" | "time" | "partySize">) {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      <li className="flex items-center gap-3 rounded-card bg-sand/70 px-4 py-3">
        <CalendarIcon className="size-5 shrink-0 text-accent-ink" />
        <span>
          <span className="sr-only">Date: </span>
          {formatDateLong(date)}
        </span>
      </li>
      <li className="flex items-center gap-3 rounded-card bg-sand/70 px-4 py-3">
        <ClockIcon className="size-5 shrink-0 text-accent-ink" />
        <span>
          <span className="sr-only">Time: </span>
          {formatTime(time)}
        </span>
      </li>
      <li className="flex items-center gap-3 rounded-card bg-sand/70 px-4 py-3">
        <UsersIcon className="size-5 shrink-0 text-accent-ink" />
        <span>
          <span className="sr-only">Party: </span>
          {formatPartySize(partySize)}
        </span>
      </li>
    </ul>
  );
}

/** Guest details for a booking. */
export function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <dl className="divide-y divide-line">
      <Row label="Name">
        {booking.firstName} {booking.lastName}
      </Row>
      <Row label="Email">{booking.email}</Row>
      <Row label="Phone">{formatUsPhone(booking.phone)}</Row>
      {booking.occasion !== "none" ? <Row label="Occasion">{OCCASION_LABELS[booking.occasion]}</Row> : null}
      {booking.specialRequests ? <Row label="Special requests">{booking.specialRequests}</Row> : null}
      <Row label="Text reminder">{booking.smsReminder ? "Requested (demo — no texts are sent)" : "Off"}</Row>
    </dl>
  );
}
