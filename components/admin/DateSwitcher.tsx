"use client";

import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { addDaysToDateKey, isDateKey, type DateKey } from "@/lib/time";

interface DateSwitcherProps {
  date: DateKey;
  today: DateKey;
  onChange: (date: DateKey) => void;
}

export function DateSwitcher({ date, today, onChange }: DateSwitcherProps) {
  const inputId = useId();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" size="iconSm" onClick={() => onChange(addDaysToDateKey(date, -1))}>
          <ChevronLeftIcon />
          <span className="sr-only">Previous day</span>
        </Button>
        <Button variant={date === today ? "subtle" : "secondary"} size="sm" onClick={() => onChange(today)} aria-pressed={date === today}>
          Today
        </Button>
        <Button variant="secondary" size="iconSm" onClick={() => onChange(addDaysToDateKey(date, 1))}>
          <ChevronRightIcon />
          <span className="sr-only">Next day</span>
        </Button>
      </div>
      <label htmlFor={inputId} className="sr-only">
        Go to date
      </label>
      <input
        id={inputId}
        type="date"
        value={date}
        onChange={(event) => {
          if (isDateKey(event.target.value)) onChange(event.target.value);
        }}
        className="min-h-11 min-w-40 flex-1 rounded-full border border-line-strong bg-surface px-4 text-base sm:flex-none"
      />
    </div>
  );
}
