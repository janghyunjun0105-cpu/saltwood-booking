"use client";

import { format, getDaysInMonth } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { DateAvailability, DateState } from "@/lib/availability";
import { cn } from "@/lib/cn";
import { formatDateLong, parseDateKey, toDateKey, weekdayOf, type DateKey } from "@/lib/time";

const STATE_LABELS: Record<DateState, string | null> = {
  open: null,
  closed: "Closed",
  blackout: "Closed",
  full: "Full",
  past: "No times",
};

function accessibleLabel(day: DateAvailability, today: DateKey): string {
  const base = `${formatDateLong(day.date)}${day.date === today ? ", today" : ""}`;
  const state = STATE_LABELS[day.state];
  return state ? `${base}, ${state.toLowerCase()}` : base;
}

interface DatePickerProps {
  dates: DateAvailability[];
  value: DateKey | null;
  onChange: (date: DateKey) => void;
  legend?: string;
}

/**
 * Phones get a horizontal, scroll-snapping day strip; 768px and up get a month grid.
 * Both are native radio groups, so arrow keys move between days and unavailable days are skipped.
 */
export function DatePicker({ dates, value, onChange, legend = "Pick a date" }: DatePickerProps) {
  const today = dates[0]?.date ?? "";
  return (
    <fieldset>
      <legend className="font-display text-xl font-semibold">{legend}</legend>
      <DayStrip dates={dates} value={value} onChange={onChange} today={today} />
      <MonthGrid dates={dates} value={value} onChange={onChange} today={today} />
    </fieldset>
  );
}

interface PartProps extends Omit<DatePickerProps, "legend"> {
  today: DateKey;
}

function DayStrip({ dates, value, onChange, today }: PartProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the selected day in view (e.g. when returning to this step).
  useEffect(() => {
    const strip = stripRef.current;
    const selected = strip?.querySelector<HTMLElement>("input:checked")?.parentElement;
    if (!strip || !selected) return;
    const offset = selected.offsetLeft - strip.clientWidth / 2 + selected.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, offset) });
  }, [value]);

  return (
    <div className="relative mt-4 md:hidden">
      <div
        ref={stripRef}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {dates.map((day) => {
          const date = parseDateKey(day.date);
          const disabled = day.state !== "open";
          return (
            <label key={day.date} className="relative shrink-0 snap-start">
              <input
                type="radio"
                name="date-strip"
                value={day.date}
                checked={value === day.date}
                disabled={disabled}
                onChange={() => onChange(day.date)}
                aria-label={accessibleLabel(day, today)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-22 w-17 flex-col items-center justify-center rounded-card border text-center transition-colors",
                  "border-line-strong bg-surface peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white",
                  "peer-focus-visible:focus-ring peer-disabled:border-transparent peer-disabled:bg-sand/80 peer-disabled:text-muted",
                )}
              >
                <span className="text-xs font-medium uppercase">{day.date === today ? "Today" : format(date, "EEE")}</span>
                <span className="font-display text-2xl leading-tight font-semibold">{format(date, "d")}</span>
                <span className="text-xs">{STATE_LABELS[day.state] ?? format(date, "MMM")}</span>
              </span>
            </label>
          );
        })}
      </div>
      {/* Fade hints that the strip scrolls sideways. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -right-4 w-8 bg-gradient-to-l from-background sm:-right-6"
      />
    </div>
  );
}

const WEEKDAYS = [
  ["S", "Sunday"],
  ["M", "Monday"],
  ["T", "Tuesday"],
  ["W", "Wednesday"],
  ["T", "Thursday"],
  ["F", "Friday"],
  ["S", "Saturday"],
] as const;

function MonthGrid({ dates, value, onChange, today }: PartProps) {
  const byDate = new Map(dates.map((day) => [day.date, day]));
  const months = [...new Set(dates.map((day) => day.date.slice(0, 7)))];
  const valueMonth = value ? months.indexOf(value.slice(0, 7)) : -1;
  const [monthIndex, setMonthIndex] = useState(Math.max(0, valueMonth));
  const month = months[Math.min(monthIndex, months.length - 1)] ?? today.slice(0, 7);
  const firstOfMonth = parseDateKey(`${month}-01`);
  const leadingBlanks = weekdayOf(`${month}-01`);
  const daysInMonth = getDaysInMonth(firstOfMonth);

  return (
    <div className="mt-4 hidden max-w-md md:block">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthIndex((index) => Math.max(0, index - 1))}
          disabled={monthIndex === 0}
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-sand disabled:opacity-30"
        >
          <ChevronLeftIcon />
          <span className="sr-only">Previous month</span>
        </button>
        <p className="font-semibold" aria-live="polite">
          {format(firstOfMonth, "MMMM yyyy")}
        </p>
        <button
          type="button"
          onClick={() => setMonthIndex((index) => Math.min(months.length - 1, index + 1))}
          disabled={monthIndex >= months.length - 1}
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-sand disabled:opacity-30"
        >
          <ChevronRightIcon />
          <span className="sr-only">Next month</span>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted" aria-hidden="true">
        {WEEKDAYS.map(([short, full]) => (
          <abbr key={full} title={full} className="py-1 no-underline">
            {short}
          </abbr>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const key = toDateKey(new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), index + 1));
          const day = byDate.get(key);
          if (!day) {
            return (
              <span key={key} aria-hidden="true" className="flex h-12 items-center justify-center text-sm text-muted/40">
                {index + 1}
              </span>
            );
          }
          const disabled = day.state !== "open";
          return (
            <label key={key} className="relative">
              <input
                type="radio"
                name="date-grid"
                value={key}
                checked={value === key}
                disabled={disabled}
                onChange={() => onChange(key)}
                aria-label={accessibleLabel(day, today)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                title={STATE_LABELS[day.state] ?? undefined}
                className={cn(
                  "flex h-12 flex-col items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors",
                  "border-transparent hover:border-line-strong peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white",
                  "peer-focus-visible:focus-ring peer-disabled:text-muted/60 peer-disabled:line-through peer-disabled:hover:border-transparent",
                  key === today && "underline decoration-accent decoration-2 underline-offset-4",
                )}
              >
                {index + 1}
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">Crossed-out days are closed or fully booked.</p>
    </div>
  );
}
