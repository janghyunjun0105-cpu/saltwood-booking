"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { CheckboxField, Field } from "@/components/ui/Field";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { OCCASION_LABELS, OCCASIONS, SPECIAL_REQUESTS_MAX } from "@/lib/constants";
import { guestDetailsSchema, type GuestDetails, type GuestDetailsInput } from "@/lib/schemas";
import { formatUsPhone, normalizeUsPhone } from "@/lib/time";
import { cn } from "@/lib/cn";

interface GuestFormProps {
  defaultValues: GuestDetailsInput;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (guest: GuestDetails) => void;
  /** Receives the current values so nothing typed is lost when going back. */
  onBack: (values: GuestDetailsInput) => void;
}

export function GuestForm({ defaultValues, submitting, submitError, onSubmit, onBack }: GuestFormProps) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors, submitCount },
  } = useForm<GuestDetailsInput, unknown, GuestDetails>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues,
    mode: "onTouched",
  });

  const requests = useWatch({ control, name: "specialRequests" }) ?? "";
  const remaining = SPECIAL_REQUESTS_MAX - requests.length;
  const errorCount = Object.keys(errors).length;
  const showSummary = submitCount > 0 && errorCount > 0;

  // Tidy a valid number into (512) 555-0147 once the guest leaves the field.
  function formatPhoneOnBlur(event: React.FocusEvent<HTMLInputElement>) {
    const digits = normalizeUsPhone(event.target.value);
    if (digits) setValue("phone", formatUsPhone(digits), { shouldValidate: true });
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div aria-live="assertive">
        {showSummary ? (
          <Notice tone="danger" title="Please check the highlighted fields">
            {errorCount === 1 ? "One field needs attention." : `${errorCount} fields need attention.`}
          </Notice>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName?.message}>
          {(control) => (
            <input {...control} {...register("firstName")} type="text" autoComplete="given-name" autoCapitalize="words" />
          )}
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          {(control) => (
            <input {...control} {...register("lastName")} type="text" autoComplete="family-name" autoCapitalize="words" />
          )}
        </Field>
        <Field label="Email" error={errors.email?.message} hint="You'll use it with your booking code to make changes.">
          {(control) => (
            <input
              {...control}
              {...register("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
            />
          )}
        </Field>
        <Field label="Mobile phone" error={errors.phone?.message} hint="Only used if something changes.">
          {(control) => (
            <input
              {...control}
              {...register("phone", { onBlur: formatPhoneOnBlur })}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(512) 555-0147"
            />
          )}
        </Field>
      </div>

      <Field label="Occasion" error={errors.occasion?.message} className="sm:max-w-xs">
        {(control) => (
          <select {...control} {...register("occasion")} className={cn(control.className, "appearance-auto pr-3")}>
            {OCCASIONS.map((occasion) => (
              <option key={occasion} value={occasion}>
                {OCCASION_LABELS[occasion]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label="Special requests"
        optional
        error={errors.specialRequests?.message}
        hint="Allergies, accessibility needs, a high chair — anything that helps."
        aside={
          <span className={cn("text-sm tabular-nums", remaining <= 20 ? "font-semibold text-accent-ink" : "text-muted")}>
            {requests.length}/{SPECIAL_REQUESTS_MAX}
            <span className="sr-only" aria-live="polite">
              {remaining <= 20 ? `${remaining} characters left` : ""}
            </span>
          </span>
        }
      >
        {(control) => (
          <textarea
            {...control}
            {...register("specialRequests")}
            rows={3}
            maxLength={SPECIAL_REQUESTS_MAX}
            className={cn(control.className, "resize-y")}
          />
        )}
      </Field>

      <CheckboxField
        {...register("smsReminder")}
        label="Text me a reminder the day before"
        hint="Demo only — no messages are sent."
      />

      <p className="text-sm text-muted">
        We hold tables for 15 minutes past your booking time. You can change or cancel online any time before then.
      </p>

      <div aria-live="assertive">
        {submitError ? (
          <Notice tone="danger" role="alert">
            {submitError}
          </Notice>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={() => onBack(getValues())} disabled={submitting}>
          <ChevronLeftIcon className="size-5" />
          Back
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Confirming…" : "Confirm booking"}
        </Button>
      </div>
    </form>
  );
}
