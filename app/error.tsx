"use client";

import { useEffect } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AlertIcon } from "@/components/ui/icons";
import { RESTAURANT } from "@/lib/restaurant";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center">
          <Wordmark />
        </div>
      </header>
      <main id="main" className="flex flex-1 items-center">
        <div className="container-page py-20 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertIcon className="size-7" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            This page hit an unexpected error. Try again, or call us at{" "}
            <a href={RESTAURANT.phoneHref} className="font-medium text-primary underline underline-offset-4">
              {RESTAURANT.phoneDisplay}
            </a>{" "}
            and we&rsquo;ll help you book.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => retry()}>Try again</Button>
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
          </div>
        </div>
      </main>
    </>
  );
}
