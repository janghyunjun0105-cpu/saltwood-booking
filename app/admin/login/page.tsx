import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Wordmark } from "@/components/layout/Wordmark";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { LoadingCard } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Staff sign-in",
};

export default function AdminLoginPage() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center py-12">
      <div className="container-page">
        <div className="mx-auto max-w-md">
          <div className="flex justify-center">
            <Wordmark />
          </div>
          <div className="mt-8 rounded-card border border-line bg-surface p-6 sm:p-8">
            <h1 className="font-display text-2xl font-semibold">Staff sign-in</h1>
            <p className="mt-1 text-muted">See today&rsquo;s bookings and update the restaurant&rsquo;s hours.</p>
            <div className="mt-6">
              <Suspense fallback={<LoadingCard label="Loading…" />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
          <Link
            href="/"
            className="mx-auto mt-6 flex min-h-11 w-fit items-center gap-1 rounded-full px-3 text-sm font-medium text-muted hover:text-ink"
          >
            <ChevronLeftIcon className="size-4" />
            Back to the website
          </Link>
        </div>
      </div>
    </main>
  );
}
