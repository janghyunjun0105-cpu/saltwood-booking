import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerOutline"
  | "dangerGhost"
  | "subtle"
  | "inverse"
  | "inverseGhost";
type Size = "sm" | "md" | "lg" | "icon" | "iconSm";

interface ButtonStyleOptions {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-sand",
  ghost: "text-ink hover:bg-sand",
  danger: "bg-danger text-white hover:bg-danger-hover",
  dangerOutline: "border border-danger/40 bg-surface text-danger hover:border-danger hover:bg-danger-soft",
  dangerGhost: "text-danger hover:bg-danger-soft",
  subtle: "bg-primary-soft text-primary hover:bg-[#d3e2d8]",
  // For dark (primary) backgrounds.
  inverse: "bg-background text-primary hover:bg-white focus-visible:outline-background",
  inverseGhost: "text-white hover:bg-white/10 focus-visible:outline-background",
};

// Every size keeps a 44px minimum touch target.
const SIZES: Record<Size, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-13 px-7 text-base",
  icon: "size-13 shrink-0",
  iconSm: "size-11 shrink-0",
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth }: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap",
    "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

export function Button({ variant, size, fullWidth, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleOptions;

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...props} />;
}
