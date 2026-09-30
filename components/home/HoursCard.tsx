"use client";

import { ClockIcon } from "@/components/ui/icons";
import { getDateClosure } from "@/lib/availability";
import { describeServiceStatus, getServiceStatus, summarizeWeeklyHours } from "@/lib/hours";
import { useRestaurantNow } from "@/lib/hooks/useRestaurantNow";
import { useSettings } from "@/lib/hooks/useSettings";
import { addDaysToDateKey, formatDateShort } from "@/lib/time";
import { cn } from "@/lib/cn";

/** Hours are read from settings, so changes in the admin show up here right away. */
export function HoursCard() {
  const { settings } = useSettings();
  const now = useRestaurantNow();
  const rows = summarizeWeeklyHours(settings);
  const status = now ? getServiceStatus(settings, now) : null;

  const upcomingClosures = now
    ? settings.blackoutDates.filter(
        (date) => date >= now.date && date <= addDaysToDateKey(now.date, 30) && getDateClosure(settings, date) === "blackout",
      )
    : [];

  return (
    <section aria-labelledby="hours-heading" className="rounded-card border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="hours-heading" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <ClockIcon className="size-6 text-accent-ink" />
          Hours
        </h3>
        <p
          className={cn(
            "inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-sm font-medium",
            status?.kind === "serving" ? "bg-success-soft text-success" : "bg-sand text-muted",
            !status && "invisible",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", status?.kind === "serving" ? "bg-success" : "bg-muted/60")}
          />
          {status && now ? describeServiceStatus(status, now) : "Checking hours"}
        </p>
      </div>

      <dl className="mt-6 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="font-medium">
              <span aria-hidden="true">{row.label}</span>
              <span className="sr-only">{row.fullLabel}</span>
            </dt>
            <dd className="text-muted">
              {row.closed ? (
                "Closed"
              ) : (
                <ul className="space-y-0.5">
                  {row.services.map((service) => (
                    <li key={service.service}>
                      <span className="text-ink">{service.label}</span> {service.range}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {upcomingClosures.length > 0 ? (
        <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">
          <span className="font-medium">Closed for private events:</span>{" "}
          {upcomingClosures.map((date) => formatDateShort(date)).join(", ")}
        </p>
      ) : null}

      <p className="mt-4 text-sm text-muted">Times shown are last seatings, in Austin (Central) time.</p>
    </section>
  );
}
