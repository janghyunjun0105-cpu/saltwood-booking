"use client";

import type { SlotAvailability } from "@/lib/availability";
import { cn } from "@/lib/cn";
import { SERVICE_LABELS, SERVICES } from "@/lib/constants";
import { formatTime, formatTimeRange, type TimeKey } from "@/lib/time";

interface TimeSlotGridProps {
  slots: SlotAvailability[];
  value: TimeKey | null;
  onChange: (time: TimeKey) => void;
}

function availabilityLabel(slot: SlotAvailability): string {
  if (slot.state === "past") return "Unavailable";
  if (slot.state === "full") return "Full";
  return `${slot.remaining} ${slot.remaining === 1 ? "table" : "tables"} left`;
}

/**
 * Seatings grouped into Lunch and Dinner. All times share one radio group,
 * so arrow keys move through every open time and skip full or past ones.
 */
export function TimeSlotGrid({ slots, value, onChange }: TimeSlotGridProps) {
  return (
    <div className="space-y-8">
      {SERVICES.map((service) => {
        const serviceSlots = slots.filter((slot) => slot.service === service);
        if (serviceSlots.length === 0) return null;
        const first = serviceSlots[0].time;
        const last = serviceSlots[serviceSlots.length - 1].time;
        return (
          <fieldset key={service}>
            <legend className="flex w-full flex-wrap items-baseline gap-x-3">
              <span className="font-display text-xl font-semibold">{SERVICE_LABELS[service]}</span>
              <span className="text-sm text-muted">{formatTimeRange(first, last)}</span>
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {serviceSlots.map((slot) => {
                const disabled = slot.state !== "available";
                const scarce = !disabled && slot.remaining <= 2;
                return (
                  <label key={slot.time} className="relative">
                    <input
                      type="radio"
                      name="time"
                      value={slot.time}
                      checked={value === slot.time}
                      disabled={disabled}
                      onChange={() => onChange(slot.time)}
                      aria-label={`${formatTime(slot.time)}, ${availabilityLabel(slot).toLowerCase()}`}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "group flex min-h-16 flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition-colors",
                        "border-line-strong bg-surface hover:border-ink/40",
                        "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white",
                        "peer-focus-visible:focus-ring",
                        "peer-disabled:border-transparent peer-disabled:bg-sand/80 peer-disabled:text-muted peer-disabled:hover:border-transparent",
                      )}
                    >
                      <span className={cn("font-semibold tabular-nums", slot.state === "full" && "line-through")}>
                        {formatTime(slot.time)}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 text-xs",
                          value === slot.time ? "text-white/90" : scarce ? "font-semibold text-accent-ink" : "text-muted",
                        )}
                      >
                        {availabilityLabel(slot)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
