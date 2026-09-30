"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { withRepo } from "@/lib/storage/lazy";

export function DemoBanner() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!announcement) return;
    const timer = window.setTimeout(() => setAnnouncement(""), 4000);
    return () => window.clearTimeout(timer);
  }, [announcement]);

  async function resetDemoData() {
    await withRepo((repo) => repo.resetDemoData());
    setAnnouncement("Demo data reset. Fresh sample bookings are loaded.");
  }

  return (
    <div role="region" aria-label="Demo notice" className="bg-ink text-background">
      <div className="container-page flex items-center justify-between gap-3">
        <p className="py-2 text-[13px] leading-snug sm:text-sm" aria-live="polite">
          {announcement || "Demo project — bookings are saved in this browser only."}
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center rounded-full px-2 text-[13px] font-medium underline decoration-background/50 underline-offset-4 hover:decoration-background focus-visible:outline-background sm:text-sm"
        >
          Reset demo data
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={resetDemoData}
        title="Reset demo data?"
        description="This removes every booking and setting saved in this browser and loads a fresh set of sample bookings."
        confirmLabel="Reset data"
        pendingLabel="Resetting…"
        tone="danger"
      />
    </div>
  );
}
