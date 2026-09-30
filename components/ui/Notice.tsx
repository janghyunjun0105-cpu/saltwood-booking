import type { ReactNode } from "react";
import { AlertIcon, CheckCircleIcon, InfoIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, { box: string; icon: string }> = {
  info: { box: "border-line bg-sand/70", icon: "text-primary" },
  success: { box: "border-success/30 bg-success-soft", icon: "text-success" },
  warning: { box: "border-accent/40 bg-accent-soft", icon: "text-accent-ink" },
  danger: { box: "border-danger/30 bg-danger-soft", icon: "text-danger" },
};

interface NoticeProps {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  role?: "alert" | "status";
}

export function Notice({ tone = "info", title, children, className, role }: NoticeProps) {
  const Icon = tone === "success" ? CheckCircleIcon : tone === "info" ? InfoIcon : AlertIcon;
  return (
    <div role={role} className={cn("flex gap-3 rounded-card border p-4", TONES[tone].box, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", TONES[tone].icon)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title ? "mt-1" : null, "text-ink/85")}>{children}</div> : null}
      </div>
    </div>
  );
}
