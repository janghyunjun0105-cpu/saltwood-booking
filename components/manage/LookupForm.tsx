"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SearchIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { isBookingCode, normalizeBookingCodeInput } from "@/lib/bookingCode";
import { RESTAURANT } from "@/lib/restaurant";
import type { Booking } from "@/lib/schemas";
import { withRepo } from "@/lib/storage/lazy";

const lookupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter your booking code.")
    .refine(
      (value) => isBookingCode(normalizeBookingCodeInput(value)),
      "Booking codes look like SW-7K3M: 4 letters or numbers after SW-.",
    ),
  email: z
    .string()
    .trim()
    .min(1, "Enter the email you booked with.")
    .pipe(z.email("Enter a valid email address, like name@example.com.")),
});
type LookupValues = z.infer<typeof lookupSchema>;

interface LookupFormProps {
  /** Fill the code from ?code= (links from the confirmation page and calendar invite). */
  prefillFromUrl?: boolean;
  onFound: (booking: Booking) => void;
  submitLabel?: string;
}

export function LookupForm({ prefillFromUrl = false, onFound, submitLabel = "Find my booking" }: LookupFormProps) {
  const [notFound, setNotFound] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { code: "", email: "" },
    mode: "onTouched",
  });

  // Read the query string after hydration so the page itself can stay static and render instantly.
  useEffect(() => {
    if (!prefillFromUrl) return;
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) setValue("code", normalizeBookingCodeInput(code));
  }, [prefillFromUrl, setValue]);

  async function lookUp(values: LookupValues) {
    setNotFound(false);
    const code = normalizeBookingCodeInput(values.code);
    const booking = await withRepo((repo) => repo.findBookingForGuest(code, values.email));
    if (booking) onFound(booking);
    else setNotFound(true);
  }

  return (
    <form noValidate onSubmit={handleSubmit(lookUp)} className="space-y-5">
      <Field label="Booking code" error={errors.code?.message} hint="It's on your confirmation, like SW-7K3M.">
        {(control) => (
          <input
            {...control}
            {...register("code")}
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="SW-"
            className={`${control.className} font-medium tracking-wider uppercase`}
          />
        )}
      </Field>
      <Field label="Email" error={errors.email?.message}>
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

      <div aria-live="assertive">
        {notFound ? (
          <Notice tone="warning" title="We couldn't find that booking" role="alert">
            Check the code and email on your confirmation and try again. Still stuck? Call us at{" "}
            <a href={RESTAURANT.phoneHref} className="font-medium underline underline-offset-2">
              {RESTAURANT.phoneDisplay}
            </a>
            .
          </Notice>
        ) : null}
      </div>

      <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
        <SearchIcon className="size-5" />
        {isSubmitting ? "Looking…" : submitLabel}
      </Button>
    </form>
  );
}
