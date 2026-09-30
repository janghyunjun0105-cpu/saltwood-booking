"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/components/ui/icons";
import { buildBookingIcs, downloadIcs, icsFileName } from "@/lib/ics";
import type { Booking } from "@/lib/schemas";

export function AddToCalendarButton({
  booking,
  variant = "primary",
}: {
  booking: Booking;
  variant?: "primary" | "secondary";
}) {
  const [done, setDone] = useState(false);

  function download() {
    const manageUrl = `${window.location.origin}/manage?code=${booking.code}`;
    downloadIcs(icsFileName(booking), buildBookingIcs(booking, { manageUrl }));
    setDone(true);
  }

  return (
    <>
      <Button size="lg" variant={variant} onClick={download}>
        <DownloadIcon className="size-5" />
        Add to calendar
      </Button>
      <span className="sr-only" aria-live="polite">
        {done ? "Calendar file downloaded." : ""}
      </span>
    </>
  );
}

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the code is still visible to copy by hand.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-primary hover:bg-primary-soft"
    >
      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      <span aria-live="polite">{copied ? "Copied" : "Copy code"}</span>
    </button>
  );
}
