import { cn } from "@/lib/cn";
import { STATUS_LABELS, type BookingStatus } from "@/lib/constants";

const STYLES: Record<BookingStatus, { chip: string; dot: string }> = {
  confirmed: { chip: "bg-primary-soft text-primary", dot: "bg-primary" },
  seated: { chip: "bg-accent-soft text-accent-ink", dot: "bg-accent" },
  completed: { chip: "bg-sand text-muted", dot: "bg-muted" },
  no_show: { chip: "bg-danger-soft text-danger", dot: "bg-danger" },
  cancelled: { chip: "border border-line-strong bg-surface text-muted", dot: "bg-line-strong" },
};

export function StatusChip({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium whitespace-nowrap",
        STYLES[status].chip,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", STYLES[status].dot)} />
      {STATUS_LABELS[status]}
    </span>
  );
}
