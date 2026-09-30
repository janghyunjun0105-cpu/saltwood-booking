import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { BOOKING_WINDOW_DAYS } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Book a table",
  description: `Book a table at Saltwood Kitchen in Austin, TX. Pick your party size, date and time — up to ${BOOKING_WINDOW_DAYS} days ahead.`,
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Book a table</h1>
        <p className="mt-2 text-muted sm:text-lg">
          Book up to {BOOKING_WINDOW_DAYS} days ahead. It takes about a minute.
        </p>
      </header>
      <div className="mt-8">
        <BookingFlow />
      </div>
    </div>
  );
}
