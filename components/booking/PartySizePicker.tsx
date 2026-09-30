"use client";

import { buttonClasses } from "@/components/ui/Button";
import { PhoneIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { RESTAURANT } from "@/lib/restaurant";

export type PartySizeValue = number | "large";

interface PartySizePickerProps {
  value: PartySizeValue | null;
  max: number;
  onChange: (value: PartySizeValue) => void;
}

const CHIP = cn(
  "flex h-12 min-w-12 items-center justify-center rounded-full border border-line-strong bg-surface px-3 font-medium tabular-nums transition-colors",
  "hover:border-ink/40 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:focus-ring",
);

export function PartySizePicker({ value, max, onChange }: PartySizePickerProps) {
  const sizes = Array.from({ length: max }, (_, index) => index + 1);
  const large = value === "large" || (typeof value === "number" && value > max);

  return (
    <fieldset>
      <legend className="font-display text-xl font-semibold">How many guests?</legend>
      <div className="mt-4 flex flex-wrap gap-2">
        {sizes.map((size) => (
          <label key={size} className="relative">
            <input
              type="radio"
              name="party-size"
              value={size}
              checked={value === size}
              onChange={() => onChange(size)}
              className="peer sr-only"
            />
            <span className={CHIP}>
              <span aria-hidden="true">{size}</span>
              <span className="sr-only">{size === 1 ? "1 guest" : `${size} guests`}</span>
            </span>
          </label>
        ))}
        <label className="relative">
          <input
            type="radio"
            name="party-size"
            value="large"
            checked={large}
            onChange={() => onChange("large")}
            className="peer sr-only"
          />
          <span className={CHIP}>
            <span aria-hidden="true">{max + 1}+</span>
            <span className="sr-only">{max + 1} or more guests</span>
          </span>
        </label>
      </div>

      <div aria-live="polite">
        {large ? (
          <Notice tone="warning" title="Call us for large parties" className="mt-4">
            <p>
              For {max + 1} or more guests we set up a private table and a fixed menu. Give us a call and we&rsquo;ll
              take care of it.
            </p>
            <a href={RESTAURANT.phoneHref} className={cn(buttonClasses({ size: "sm" }), "mt-3")}>
              <PhoneIcon className="size-4" />
              Call {RESTAURANT.phoneDisplay}
            </a>
          </Notice>
        ) : null}
      </div>
    </fieldset>
  );
}
