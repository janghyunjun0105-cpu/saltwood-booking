"use client";

import { useState } from "react";
import { ActionBar } from "@/components/booking/ActionBar";
import { DatePicker } from "@/components/booking/DatePicker";
import { PartySizePicker, type PartySizeValue } from "@/components/booking/PartySizePicker";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { LoadingCard } from "@/components/ui/Skeleton";
import { getBookableDates, getSlotAvailability } from "@/lib/availability";
import { useRepoQuery } from "@/lib/hooks/useRepoQuery";
import { useRestaurantNow } from "@/lib/hooks/useRestaurantNow";
import type { Booking } from "@/lib/schemas";
import { BookingUnavailableError } from "@/lib/storage/errors";
import { withRepo } from "@/lib/storage/lazy";
import { formatDateShort, formatPartySize, formatTime, type DateKey, type TimeKey } from "@/lib/time";

interface RescheduleFormProps {
  booking: Booking;
  onSaved: (booking: Booking) => void;
  onCancel: () => void;
}

/** Same pickers and rules as the booking flow; the booking's own table doesn't count against it. */
export function RescheduleForm({ booking, onSaved, onCancel }: RescheduleFormProps) {
  const now = useRestaurantNow();
  const { data } = useRepoQuery("reschedule", async (repo) => {
    const [settings, bookings] = await Promise.all([repo.getSettings(), repo.listBookings()]);
    return { settings, bookings };
  });

  const [partySize, setPartySize] = useState<PartySizeValue>(booking.partySize);
  const [date, setDate] = useState<DateKey>(booking.date);
  const [time, setTime] = useState<TimeKey | null>(booking.time);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!data || !now) return <LoadingCard label="Loading available times…" />;

  const { settings, bookings } = data;
  const exclude = { excludeBookingId: booking.id };
  const dates = getBookableDates({ settings, bookings, now, ...exclude });
  const slots = getSlotAvailability({ settings, bookings, date, now, ...exclude });
  const selectedSlot = slots.find((slot) => slot.time === time && slot.state === "available");
  const size = typeof partySize === "number" && partySize <= settings.maxPartySize ? partySize : null;
  const unchanged = date === booking.date && time === booking.time && size === booking.partySize;

  async function save() {
    if (!selectedSlot || size === null) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await withRepo((repo) => repo.rescheduleBooking(booking.id, { date, time: selectedSlot.time, partySize: size }));
      onSaved(updated);
    } catch (caught) {
      setSaving(false);
      if (caught instanceof BookingUnavailableError) {
        setTime(null);
        setError(caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : "We couldn't save that change. Please try again.");
      }
    }
  }

  return (
    <section aria-labelledby="reschedule-heading">
      <h2 id="reschedule-heading" className="font-display text-2xl font-semibold">
        Change your booking
      </h2>
      <p className="mt-1 text-muted">
        Currently {formatDateShort(booking.date)} at {formatTime(booking.time)} for {formatPartySize(booking.partySize)}.
      </p>

      <div className="mt-8 space-y-10">
        <PartySizePicker value={partySize} max={settings.maxPartySize} onChange={setPartySize} />
        <DatePicker
          dates={dates}
          value={date}
          legend="Pick a new date"
          onChange={(next) => {
            setDate(next);
            if (next !== date) setTime(null);
          }}
        />
        <div>
          <p className="mb-4 font-display text-xl font-semibold">Times on {formatDateShort(date)}</p>
          {slots.some((slot) => slot.state === "available") ? (
            <TimeSlotGrid slots={slots} value={time} onChange={setTime} />
          ) : (
            <Notice title="No open times on this date">Try another date.</Notice>
          )}
        </div>
      </div>

      <div aria-live="assertive">
        {error ? (
          <Notice tone="warning" role="alert" className="mt-6">
            {error}
          </Notice>
        ) : null}
      </div>

      <ActionBar
        summary={[size ? formatPartySize(size) : null, formatDateShort(date), selectedSlot ? formatTime(selectedSlot.time) : null]
          .filter(Boolean)
          .join(" · ")}
      >
        <Button variant="secondary" size="lg" onClick={onCancel} disabled={saving} className="shrink-0">
          Never mind
        </Button>
        <Button
          size="lg"
          className="flex-1 md:flex-none"
          onClick={save}
          disabled={!selectedSlot || size === null || unchanged || saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </ActionBar>
    </section>
  );
}
