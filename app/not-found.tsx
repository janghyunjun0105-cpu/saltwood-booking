import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 items-center">
        <div className="container-page py-20 text-center sm:py-28">
          <p className="font-display text-7xl font-semibold text-accent-ink/80" aria-hidden="true">
            404
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">We couldn&rsquo;t find that page</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            The link may be old or mistyped. Head back to the home page or book a table.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/">Back to home</ButtonLink>
            <ButtonLink href="/book" variant="secondary">
              Book a table
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
