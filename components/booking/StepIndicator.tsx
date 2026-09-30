import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export const BOOKING_STEPS = ["Party & date", "Time", "Your details"] as const;
export type BookingStep = 1 | 2 | 3;

export function StepIndicator({ current }: { current: BookingStep }) {
  return (
    <nav aria-label="Booking progress">
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {BOOKING_STEPS.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined}>
              <div
                aria-hidden="true"
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  done || active ? "bg-primary" : "bg-line",
                )}
              />
              <p className={cn("mt-2 flex items-center gap-1.5 text-sm", active ? "font-semibold text-ink" : "text-muted")}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                    done ? "bg-primary text-white" : active ? "bg-ink text-white" : "bg-line text-muted",
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" strokeWidth={3} /> : step}
                </span>
                <span className={cn(!active && "sr-only sm:not-sr-only")}>{label}</span>
                <span className="sr-only">{done ? " (done)" : active ? " (current step)" : ""}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
