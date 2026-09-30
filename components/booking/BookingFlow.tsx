"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ActionBar } from "@/components/booking/ActionBar";
import { BookingHeadline } from "@/components/booking/BookingDetails";
import { DatePicker } from "@/components/booking/DatePicker";
import { PartySizePicker, type PartySizeValue } from "@/components/booking/PartySizePicker";
import { StepIndicator, type BookingStep } from "@/components/booking/StepIndicator";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, ChevronLeftIcon, PhoneIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { LoadingCard } from "@/components/ui/Skeleton";
import { getBookableDates, getSlotAvailability } from "@/lib/availability";
import { useRepoQuery } from "@/lib/hooks/useRepoQuery";
import { useRestaurantNow } from "@/lib/hooks/useRestaurantNow";
import { RESTAURANT } from "@/lib/restaurant";
import type { GuestDetails, GuestDetailsInput } from "@/lib/schemas";
import { BookingUnavailableError } from "@/lib/storage/errors";
import { withRepo } from "@/lib/storage/lazy";
import { formatDateShort, formatPartySize, formatTime, type DateKey, type TimeKey } from "@/lib/time";

// Step 3's form (and zod) is split into its own chunk; it's fetched in the background once step 2 opens.
const loadGuestForm = () => import("@/components/booking/GuestForm").then((module) => module.GuestForm);
const GuestForm = dynamic(loadGuestForm, { loading: () => <LoadingCard label="Loading the form…" /> });

const EMPTY_GUEST: GuestDetailsInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  occasion: "none",
  specialRequests: "",
  smsReminder: false,
};

const STEP_TITLES: Record<BookingStep, string> = {
  1: "Party size and date",
  2: "Pick a time",
  3: "Your details",
};

export function BookingFlow() {
  const router = useRouter();
  const now = useRestaurantNow();
  const { data, error } = useRepoQuery("booking-flow", async (repo) => {
    const [settings, bookings] = await Promise.all([repo.getSettings(), repo.listBookings()]);
    return { settings, bookings };
  });

  const [step, setStep] = useState<BookingStep>(1);
  const [partySize, setPartySize] = useState<PartySizeValue>(2);
  const [pickedDate, setPickedDate] = useState<DateKey | null>(null);
  const [time, setTime] = useState<TimeKey | null>(null);
  const [guest, setGuest] = useState<GuestDetailsInput>(EMPTY_GUEST);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (step >= 2) void loadGuestForm();
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  if (error) {
    return (
      <Notice tone="danger" title="We couldn't load availability" role="alert">
        Refresh the page to try again, or call us at{" "}
        <a href={RESTAURANT.phoneHref} className="font-medium underline">
          {RESTAURANT.phoneDisplay}
        </a>
        .
      </Notice>
    );
  }

  // Saved: the new booking may have taken the last table, so don't re-render the (now full) slot grid.
  if (confirmedCode) return <LoadingCard label={`Booking ${confirmedCode} confirmed. Opening your confirmation…`} />;

  // Reserve roughly the step's height so the footer doesn't jump when dates load.
  if (!data || !now) return <LoadingCard label="Loading available dates…" className="min-h-[36rem] md:min-h-[46rem]" />;

  const { settings, bookings } = data;
  const dates = getBookableDates({ settings, bookings, now });
  // Until the guest picks a date, suggest the first day with open tables.
  const date = pickedDate ?? dates.find((day) => day.state === "open")?.date ?? null;
  const dateInfo = dates.find((day) => day.date === date);
  const slots = date ? getSlotAvailability({ settings, bookings, date, now }) : [];
  const selectedSlot = slots.find((slot) => slot.time === time && slot.state === "available");
  const size = typeof partySize === "number" && partySize <= settings.maxPartySize ? partySize : null;

  const canContinueFromDate = size !== null && dateInfo?.state === "open";
  const canContinueFromTime = Boolean(selectedSlot);

  function goTo(next: BookingStep) {
    setNotice(null);
    setSubmitError(null);
    setStep(next);
  }

  async function submit(details: GuestDetails) {
    if (!date || !time || size === null) return;
    setSubmitting(true);
    setSubmitError(null);
    setGuest(details);
    try {
      // The repository re-checks availability against the latest data before saving.
      const booking = await withRepo((repo) => repo.createBooking({ date, time, partySize: size, guest: details }));
      setConfirmedCode(booking.code);
      router.push(`/book/confirmation/${booking.code}`);
    } catch (caught) {
      setSubmitting(false);
      if (caught instanceof BookingUnavailableError) {
        setTime(null);
        const backToDates = caught.reason === "closed" || caught.reason === "blackout" || caught.reason === "out_of_window";
        if (backToDates) setPickedDate(null);
        setStep(backToDates || caught.reason === "party_size" ? 1 : 2);
        setNotice(caught.message);
        return;
      }
      setSubmitError(`We couldn't save your booking. Please try again, or call us at ${RESTAURANT.phoneDisplay}.`);
    }
  }

  const summaryParts = [
    size ? formatPartySize(size) : null,
    date ? formatDateShort(date) : null,
    time ? formatTime(time) : null,
  ].filter(Boolean);

  return (
    <div ref={rootRef} className="grid scroll-mt-4 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      {/* min-w-0 stops the scrolling day strip from widening the grid track (and the page). */}
      <div className="min-w-0 md:rounded-card md:border md:border-line md:bg-surface md:p-8">
        <StepIndicator current={step} />

        <div key={step} className="mt-8 animate-step-in">
          <h2 ref={headingRef} tabIndex={-1} className="sr-only">
            Step {step} of 3: {STEP_TITLES[step]}
          </h2>

          <div aria-live="assertive">
            {notice ? (
              <Notice tone="warning" role="alert" className="mb-6">
                {notice}
              </Notice>
            ) : null}
          </div>

          {step === 1 ? (
            <>
              <div className="space-y-10">
                <PartySizePicker value={partySize} max={settings.maxPartySize} onChange={setPartySize} />
                <DatePicker
                  dates={dates}
                  value={date}
                  onChange={(next) => {
                    setPickedDate(next);
                    if (next !== date) setTime(null);
                  }}
                />
              </div>
              <ActionBar summary={summaryParts.join(" · ")}>
                <span className="hidden md:block" />
                <Button size="lg" className="flex-1 md:flex-none" disabled={!canContinueFromDate} onClick={() => goTo(2)}>
                  Continue
                  <ArrowRightIcon className="size-5" />
                </Button>
              </ActionBar>
            </>
          ) : null}

          {step === 2 && date && size ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-xl font-semibold">
                  {formatDateShort(date)} · {formatPartySize(size)}
                </p>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="inline-flex min-h-11 items-center rounded-full px-2 font-medium text-primary underline underline-offset-4"
                >
                  Change<span className="sr-only"> party size or date</span>
                </button>
              </div>

              {slots.some((slot) => slot.state === "available") ? (
                <TimeSlotGrid slots={slots} value={time} onChange={setTime} />
              ) : (
                <Notice tone="info" title="No open times on this date">
                  Every table is taken or the last seating has passed. Try another date, or call us — we sometimes
                  have cancellations.
                </Notice>
              )}

              <ActionBar summary={summaryParts.join(" · ")}>
                <Button variant="secondary" size="lg" onClick={() => goTo(1)} className="shrink-0">
                  <ChevronLeftIcon className="size-5" />
                  Back
                </Button>
                <Button size="lg" className="flex-1 md:flex-none" disabled={!canContinueFromTime} onClick={() => goTo(3)}>
                  Continue
                  <ArrowRightIcon className="size-5" />
                </Button>
              </ActionBar>
            </>
          ) : null}

          {/* Step 3 stays up even if another tab takes the slot meanwhile, so nothing typed is lost;
              the repository's re-check on submit catches it and sends the guest back to step 2. */}
          {step === 3 && date && time && size ? (
            <>
              <div className="mb-8">
                <BookingHeadline date={date} time={time} partySize={size} />
              </div>
              <GuestForm
                defaultValues={guest}
                submitting={submitting}
                submitError={submitError}
                onSubmit={submit}
                onBack={(values) => {
                  setGuest(values);
                  goTo(2);
                }}
              />
            </>
          ) : null}

        </div>
      </div>

      <aside aria-label="Your selection" className="hidden rounded-card border border-line bg-surface p-6 lg:sticky lg:top-6 lg:block">
        <h2 className="font-display text-lg font-semibold">Your table</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Guests</dt>
            <dd className="font-medium">{size ? formatPartySize(size) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Date</dt>
            <dd className="font-medium">{date ? formatDateShort(date) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Time</dt>
            <dd className="font-medium">{time ? formatTime(time) : "—"}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-line pt-5 text-sm text-muted">
          <p>
            {RESTAURANT.street}, {RESTAURANT.city}
          </p>
          <a href={RESTAURANT.phoneHref} className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium text-primary">
            <PhoneIcon className="size-4" />
            {RESTAURANT.phoneDisplay}
          </a>
        </div>
      </aside>
    </div>
  );
}
