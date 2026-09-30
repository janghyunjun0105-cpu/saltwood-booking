"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { XIcon } from "@/components/ui/icons";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Modal dialog built on the native <dialog> element. showModal() makes the rest
 * of the page inert and closes on Esc; on top of that we keep Tab inside the
 * dialog, lock page scroll, focus the [data-autofocus] element and return focus
 * to the trigger when it closes.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.getClientRects().length > 0,
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: let the parent decide, so its `open` state stays the source of truth.
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        document.documentElement.style.overflow = "";
        returnFocusRef.current?.focus();
      }}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-visible rounded-card border border-line bg-surface p-0 text-ink shadow-xl open:animate-dialog-in",
        className,
      )}
    >
      <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink"
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </button>
        <h2 id={titleId} className="pr-10 font-display text-xl font-semibold">
          {title}
        </h2>
        {description ? (
          <div id={descriptionId} className="mt-2 text-muted">
            {description}
          </div>
        ) : null}
        {children}
      </div>
    </dialog>
  );
}
