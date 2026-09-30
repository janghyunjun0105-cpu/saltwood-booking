"use client";

import { Button } from "@/components/ui/Button";
import type { Booking, BookingStatus } from "@/lib/schemas";
import { cn } from "@/lib/cn";

interface Action {
  label: string;
  to: BookingStatus;
  variant: "primary" | "secondary" | "dangerGhost";
  /** Cancelling asks for confirmation first. */
  confirm?: boolean;
}

const ACTIONS: Record<BookingStatus, Action[]> = {
  confirmed: [
    { label: "Seat", to: "seated", variant: "primary" },
    { label: "No-show", to: "no_show", variant: "secondary" },
    { label: "Cancel", to: "cancelled", variant: "dangerGhost", confirm: true },
  ],
  seated: [
    { label: "Complete", to: "completed", variant: "primary" },
    { label: "Undo seat", to: "confirmed", variant: "secondary" },
  ],
  completed: [{ label: "Reopen", to: "seated", variant: "secondary" }],
  no_show: [{ label: "Undo no-show", to: "confirmed", variant: "secondary" }],
  cancelled: [{ label: "Restore", to: "confirmed", variant: "secondary" }],
};

interface StatusActionsProps {
  booking: Booking;
  busy: boolean;
  onChange: (booking: Booking, status: BookingStatus) => void;
  onRequestCancel: (booking: Booking) => void;
  className?: string;
}

export function StatusActions({ booking, busy, onChange, onRequestCancel, className }: StatusActionsProps) {
  const guest = `${booking.firstName} ${booking.lastName}`;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {ACTIONS[booking.status].map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant}
          disabled={busy}
          onClick={() => (action.confirm ? onRequestCancel(booking) : onChange(booking, action.to))}
        >
          {action.label}
          <span className="sr-only"> — {guest}</span>
        </Button>
      ))}
    </div>
  );
}
