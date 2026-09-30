"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClasses = cn(
  "block w-full min-h-12 rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink",
  "placeholder:text-muted/80 hover:border-ink/40 transition-colors",
  "aria-invalid:border-danger aria-invalid:bg-danger-soft/30",
  "disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted",
);

export interface FieldControlProps {
  id: string;
  "aria-describedby": string;
  "aria-invalid": boolean;
  className: string;
}

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  /** Extra content on the right of the label row, e.g. a character counter. */
  aside?: ReactNode;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label + control + hint + error. The error slot is an always-present live
 * region linked through aria-describedby, so messages are read out as they appear.
 */
export function Field({ label, error, hint, optional, className, aside, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium">
          {label}
          {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
        </label>
        {aside}
      </div>
      {hint ? (
        <p id={hintId} className="mt-0.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-2">
        {children({
          id,
          "aria-describedby": [hint ? hintId : null, errorId].filter(Boolean).join(" "),
          "aria-invalid": Boolean(error),
          className: inputClasses,
        })}
      </div>
      <div id={errorId} aria-live="polite">
        {error ? <p className="mt-1.5 text-sm font-medium text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  hint?: ReactNode;
}

/** The whole label row is the tap target (44px tall), not just the 20px box. */
export function CheckboxField({ label, hint, className, ...props }: CheckboxFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-11 w-fit items-center gap-3 font-medium">
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? hintId : undefined}
          className="size-5 shrink-0 rounded border-line-strong accent-primary"
          {...props}
        />
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="-mt-1.5 pl-8 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
