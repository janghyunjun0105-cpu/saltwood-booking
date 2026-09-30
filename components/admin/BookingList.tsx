"use client";

import { StatusActions } from "@/components/admin/StatusActions";
import { PhoneIcon } from "@/components/ui/icons";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";
import { OCCASION_LABELS, type BookingStatus } from "@/lib/constants";
import type { Booking } from "@/lib/schemas";
import { formatTime, formatUsPhone } from "@/lib/time";

interface BookingListProps {
  bookings: Booking[];
  busyId: string | null;
  onChange: (booking: Booking, status: BookingStatus) => void;
  onRequestCancel: (booking: Booking) => void;
}

function Notes({ booking }: { booking: Booking }) {
  if (booking.occasion === "none" && !booking.specialRequests) return null;
  return (
    <p className="mt-1 text-sm text-muted">
      {booking.occasion !== "none" ? (
        <span className="mr-2 inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
          {OCCASION_LABELS[booking.occasion]}
        </span>
      ) : null}
      {booking.specialRequests}
    </p>
  );
}

/** Table from 768px up, stacked cards below — same data and actions in both. */
export function BookingList({ bookings, busyId, onChange, onRequestCancel }: BookingListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
        <table className="w-full text-left">
          <caption className="sr-only">Bookings, sorted by time</caption>
          <thead className="border-b border-line bg-sand/50 text-sm text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Time
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Guest
              </th>
              <th scope="col" className="px-4 py-3 text-center font-medium">
                Party
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                data-booking-id={booking.id}
                className={cn("align-top", booking.status === "cancelled" && "text-muted")}
              >
                <td className="px-4 py-4 font-semibold whitespace-nowrap tabular-nums">{formatTime(booking.time)}</td>
                <td className="max-w-md px-4 py-4">
                  <p className="font-medium">
                    {booking.firstName} {booking.lastName}
                  </p>
                  <p className="text-sm text-muted">
                    <span className="font-medium tracking-wide">{booking.code}</span> ·{" "}
                    <a href={`tel:+1${booking.phone}`} className="underline-offset-2 hover:underline">
                      {formatUsPhone(booking.phone)}
                    </a>
                  </p>
                  <Notes booking={booking} />
                </td>
                <td className="px-4 py-4 text-center tabular-nums">{booking.partySize}</td>
                <td className="px-4 py-4">
                  <StatusChip status={booking.status} />
                </td>
                <td className="px-4 py-3">
                  <StatusActions
                    booking={booking}
                    busy={busyId === booking.id}
                    onChange={onChange}
                    onRequestCancel={onRequestCancel}
                    className="justify-end"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {bookings.map((booking) => (
          <li key={booking.id} data-booking-id={booking.id} className="rounded-card border border-line bg-surface p-4">
            <article aria-label={`${formatTime(booking.time)}, ${booking.firstName} ${booking.lastName}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold tabular-nums">{formatTime(booking.time)}</p>
                  <p className={cn("font-medium", booking.status === "cancelled" && "text-muted")}>
                    {booking.firstName} {booking.lastName}
                    <span className="font-normal text-muted"> · party of {booking.partySize}</span>
                  </p>
                </div>
                <StatusChip status={booking.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                <span className="font-medium tracking-wide">{booking.code}</span>
                <a href={`tel:+1${booking.phone}`} className="inline-flex min-h-11 items-center gap-1 text-primary">
                  <PhoneIcon className="size-4" />
                  {formatUsPhone(booking.phone)}
                </a>
              </div>
              <Notes booking={booking} />
              <StatusActions
                booking={booking}
                busy={busyId === booking.id}
                onChange={onChange}
                onRequestCancel={onRequestCancel}
                className="mt-3 border-t border-line pt-3"
              />
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
