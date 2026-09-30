"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  pendingLabel = "Working…",
  cancelLabel = "Cancel",
  tone = "primary",
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setError(null);
    onClose();
  }

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setPending(false);
      onClose();
    } catch (caught) {
      setPending(false);
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onClose={close} title={title} description={description}>
      <div aria-live="assertive">
        {error ? (
          <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {/* The safe choice gets initial focus so Enter never triggers a destructive action by accident. */}
        <Button variant="secondary" onClick={close} data-autofocus disabled={pending}>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={confirm} disabled={pending}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
