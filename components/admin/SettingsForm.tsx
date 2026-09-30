"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { ActionBar } from "@/components/booking/ActionBar";
import { Button } from "@/components/ui/Button";
import { Field, inputClasses } from "@/components/ui/Field";
import { PlusIcon, XIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { LoadingCard } from "@/components/ui/Skeleton";
import { getServiceTimes, holdsTable } from "@/lib/availability";
import { cn } from "@/lib/cn";
import { useRepoQuery } from "@/lib/hooks/useRepoQuery";
import { useRestaurantNow } from "@/lib/hooks/useRestaurantNow";
import {
  PARTY_SIZE_CEILING,
  SERVICE_LABELS,
  SERVICES,
  SLOT_INTERVALS,
  TABLES_PER_SLOT_MAX,
  type Service,
} from "@/lib/constants";
import { settingsSchema, type Booking, type Settings } from "@/lib/schemas";
import { createDefaultSettings } from "@/lib/settings";
import { withRepo } from "@/lib/storage/lazy";
import { WEEKDAY_NAMES, formatDateShort, formatTime, isDateKey, minutesToTime, type DateKey } from "@/lib/time";

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
// Seating times every 15 minutes from 6:00 AM to 11:45 PM.
const TIME_OPTIONS = Array.from({ length: 72 }, (_, index) => minutesToTime(360 + index * 15));

export function SettingsPanel() {
  const now = useRestaurantNow();
  const { data } = useRepoQuery("admin-settings", async (repo) => {
    const [settings, bookings] = await Promise.all([repo.getSettings(), repo.listBookings()]);
    return { settings, bookings };
  });

  if (!data || !now) return <LoadingCard label="Loading settings…" />;
  return <SettingsForm initial={data.settings} bookings={data.bookings} today={now.date} />;
}

interface SettingsFormProps {
  initial: Settings;
  bookings: Booking[];
  today: DateKey;
}

function SettingsForm({ initial, bookings, today }: SettingsFormProps) {
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, submitCount },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
    mode: "onChange",
  });
  const weeklyHours = useWatch({ control, name: "weeklyHours" });
  const interval = useWatch({ control, name: "slotIntervalMinutes" });

  async function save(values: Settings) {
    setSaveError(null);
    try {
      const stored = await withRepo((repo) => repo.saveSettings(values));
      reset(stored);
      setSaved("Settings saved. Online booking uses them right away.");
    } catch {
      setSaveError("Those settings couldn't be saved. Check the highlighted fields.");
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form noValidate onSubmit={handleSubmit(save)} onChange={() => setSaved(null)} className="space-y-10">
      <div aria-live="polite">
        {saved && !isDirty ? (
          <Notice tone="success" className="animate-step-in">
            {saved}
          </Notice>
        ) : null}
        {submitCount > 0 && hasErrors ? (
          <Notice tone="danger" title="Some settings need attention">
            Fix the highlighted fields, then save again.
          </Notice>
        ) : null}
        {saveError ? (
          <Notice tone="danger" role="alert">
            {saveError}
          </Notice>
        ) : null}
      </div>

      <section aria-labelledby="hours-heading">
        <h2 id="hours-heading" className="font-display text-2xl font-semibold">
          Opening hours
        </h2>
        <p className="mt-1 text-muted">Times are first and last seatings, in restaurant time (Central).</p>
        <div className="mt-5 space-y-3">
          {DISPLAY_ORDER.map((weekday) => (
            <DayRow
              key={weekday}
              weekday={weekday}
              day={weeklyHours[weekday]}
              interval={interval}
              control={control}
              register={register}
              errors={errors}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="seating-heading">
        <h2 id="seating-heading" className="font-display text-2xl font-semibold">
          Seating
        </h2>
        <div className="mt-5 grid gap-6 rounded-card border border-line bg-surface p-5 sm:grid-cols-3 sm:p-6">
          <fieldset>
            <legend className="font-medium">Slot interval</legend>
            <Controller
              control={control}
              name="slotIntervalMinutes"
              render={({ field }) => (
                <div className="mt-2 flex gap-2">
                  {SLOT_INTERVALS.map((minutes) => (
                    <label key={minutes} className="relative">
                      <input
                        type="radio"
                        name={field.name}
                        value={minutes}
                        checked={field.value === minutes}
                        onChange={() => field.onChange(minutes)}
                        onBlur={field.onBlur}
                        className="peer sr-only"
                      />
                      <span className="flex min-h-12 items-center rounded-full border border-line-strong bg-surface px-4 font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:focus-ring">
                        {minutes} min
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
          </fieldset>
          <Field label="Tables per slot" error={errors.tablesPerSlot?.message} hint="One booking holds one table.">
            {(controlProps) => (
              <input
                {...controlProps}
                {...register("tablesPerSlot", { valueAsNumber: true })}
                type="number"
                inputMode="numeric"
                min={1}
                max={TABLES_PER_SLOT_MAX}
              />
            )}
          </Field>
          <Field
            label="Max party size"
            error={errors.maxPartySize?.message}
            hint="Bigger groups are asked to call."
          >
            {(controlProps) => (
              <input
                {...controlProps}
                {...register("maxPartySize", { valueAsNumber: true })}
                type="number"
                inputMode="numeric"
                min={1}
                max={PARTY_SIZE_CEILING}
              />
            )}
          </Field>
        </div>
      </section>

      <section aria-labelledby="blackout-heading">
        <h2 id="blackout-heading" className="font-display text-2xl font-semibold">
          Blackout dates
        </h2>
        <p className="mt-1 text-muted">Holidays, private events or repairs. Guests can&rsquo;t book these dates.</p>
        <Controller
          control={control}
          name="blackoutDates"
          render={({ field }) => (
            <BlackoutEditor value={field.value} onChange={field.onChange} bookings={bookings} today={today} />
          )}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Button
          variant="ghost"
          disabled={isSubmitting}
          onClick={() => reset(createDefaultSettings(), { keepDefaultValues: true })}
        >
          Restore default settings
        </Button>
        <p className="text-sm text-muted">Tue–Sun, lunch and dinner, 6 tables every 30 minutes. Not saved until you save.</p>
      </div>

      <ActionBar>
        <Button variant="secondary" size="lg" disabled={!isDirty || isSubmitting} onClick={() => reset()} className="shrink-0">
          Discard
        </Button>
        <Button type="submit" size="lg" className="flex-1 md:flex-none" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </Button>
      </ActionBar>
    </form>
  );
}

type FormControl = ReturnType<typeof useForm<Settings>>["control"];
type FormRegister = ReturnType<typeof useForm<Settings>>["register"];

interface DayRowProps {
  weekday: number;
  day: Settings["weeklyHours"][number];
  interval: number;
  control: FormControl;
  register: FormRegister;
  errors: FieldErrors<Settings>;
}

function DayRow({ weekday, day, interval, control, register, errors }: DayRowProps) {
  const name = WEEKDAY_NAMES[weekday];
  const seatings = day.closed
    ? 0
    : SERVICES.reduce((sum, service) => sum + getServiceTimes(day[service], interval).length, 0);

  return (
    <fieldset className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <legend className="sr-only">{name}</legend>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold" aria-hidden="true">
            {name}
          </p>
          <p className="text-sm text-muted">
            {day.closed || seatings === 0 ? "Closed all day" : `${seatings} seatings`}
          </p>
        </div>
        <Controller
          control={control}
          name={`weeklyHours.${weekday}.closed`}
          render={({ field }) => (
            <Switch label={`Open on ${name}s`} checked={!field.value} onChange={(open) => field.onChange(!open)} />
          )}
        />
      </div>
      {day.closed ? null : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {SERVICES.map((service) => (
            <ServiceRow
              key={service}
              weekday={weekday}
              service={service}
              enabled={day[service].enabled}
              register={register}
              errors={errors}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

interface ServiceRowProps {
  weekday: number;
  service: Service;
  enabled: boolean;
  register: FormRegister;
  errors: FieldErrors<Settings>;
}

function ServiceRow({ weekday, service, enabled, register, errors }: ServiceRowProps) {
  const id = useId();
  const day = WEEKDAY_NAMES[weekday];
  const label = SERVICE_LABELS[service];
  const serviceErrors = errors.weeklyHours?.[weekday]?.[service];
  const error = serviceErrors?.start?.message ?? serviceErrors?.end?.message;
  const errorId = `${id}-error`;

  return (
    <div className="rounded-lg bg-sand/60 p-3">
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input type="checkbox" {...register(`weeklyHours.${weekday}.${service}.enabled`)} className="size-5 accent-primary" />
        {label}
        <span className="sr-only"> on {day}s</span>
      </label>
      {enabled ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <label htmlFor={`${id}-start`} className="sr-only">
            {label} first seating on {day}s
          </label>
          <select
            id={`${id}-start`}
            {...register(`weeklyHours.${weekday}.${service}.start`)}
            aria-invalid={Boolean(serviceErrors?.start)}
            aria-describedby={errorId}
            className={cn(inputClasses, "w-auto min-w-32 flex-1")}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted" aria-hidden="true">
            to
          </span>
          <label htmlFor={`${id}-end`} className="sr-only">
            {label} last seating on {day}s
          </label>
          <select
            id={`${id}-end`}
            {...register(`weeklyHours.${weekday}.${service}.end`)}
            aria-invalid={Boolean(serviceErrors?.end)}
            aria-describedby={errorId}
            className={cn(inputClasses, "w-auto min-w-32 flex-1")}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-sm text-muted">No {label.toLowerCase()} service</p>
      )}
      <div id={errorId} aria-live="polite">
        {enabled && error ? <p className="mt-1.5 text-sm font-medium text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex min-h-11 shrink-0 items-center gap-3">
      <span className="text-sm font-medium text-muted" aria-hidden="true">
        {checked ? "Open" : "Closed"}
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:focus-ring after:absolute after:top-0.5 after:left-0.5 after:size-6 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}

interface BlackoutEditorProps {
  value: DateKey[];
  onChange: (dates: DateKey[]) => void;
  bookings: Booking[];
  today: DateKey;
}

function BlackoutEditor({ value, onChange, bookings, today }: BlackoutEditorProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const upcoming = [...value].sort();

  function add() {
    if (!isDateKey(draft)) return setError("Pick a date first.");
    if (draft < today) return setError("That date has already passed.");
    if (value.includes(draft)) return setError(`${formatDateShort(draft)} is already blacked out.`);
    onChange([...value, draft].sort());
    setDraft("");
    setError(null);
  }

  return (
    <div className="mt-5 rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 sm:max-w-xs">
          <label htmlFor={inputId} className="font-medium">
            Add a date
          </label>
          <input
            id={inputId}
            type="date"
            min={today}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            aria-describedby={`${inputId}-error`}
            aria-invalid={Boolean(error)}
            className={cn(inputClasses, "mt-2")}
          />
        </div>
        <Button variant="secondary" onClick={add}>
          <PlusIcon className="size-5" />
          Add blackout date
        </Button>
      </div>
      <div id={`${inputId}-error`} aria-live="polite">
        {error ? <p className="mt-1.5 text-sm font-medium text-danger">{error}</p> : null}
      </div>

      {upcoming.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Blackout dates">
          {upcoming.map((date) => {
            const affected = bookings.filter((booking) => booking.date === date && holdsTable(booking)).length;
            return (
              <li
                key={date}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-4 text-sm",
                  date < today ? "border-line text-muted" : "border-line-strong bg-background",
                )}
              >
                <span className="font-medium">{formatDateShort(date)}</span>
                {affected > 0 ? (
                  <span className="ml-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
                    {affected} existing {affected === 1 ? "booking" : "bookings"}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((existing) => existing !== date))}
                  className="inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink"
                >
                  <XIcon className="size-4" />
                  <span className="sr-only">Remove {formatDateShort(date)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">No blackout dates.</p>
      )}
      {upcoming.some((date) => bookings.some((booking) => booking.date === date && holdsTable(booking))) ? (
        <p className="mt-4 text-sm text-muted">
          Existing bookings on a blackout date stay on the books. Contact those guests from the dashboard.
        </p>
      ) : null}
    </div>
  );
}
