"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { InfoIcon } from "@/components/ui/icons";
import { DEMO_PASSCODE, safeAdminRedirect, signInAdmin } from "@/lib/adminSession";
import { useAdminSession } from "@/lib/hooks/useAdminSession";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedIn = useAdminSession();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const next = safeAdminRedirect(searchParams.get("next"));

  // Already signed in this session: skip the form.
  useEffect(() => {
    if (signedIn) router.replace(next);
  }, [signedIn, next, router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passcode.trim()) {
      setError("Enter the passcode.");
      return;
    }
    if (!signInAdmin(passcode)) {
      setError("That passcode didn't match. Try again.");
      return;
    }
    router.replace(next);
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <div className="flex gap-3 rounded-card border border-accent/40 bg-accent-soft p-4">
        <InfoIcon className="mt-0.5 size-5 shrink-0 text-accent-ink" />
        <p>
          <span className="font-semibold">Demo passcode: {DEMO_PASSCODE}</span>
          <span className="block text-sm text-ink/80">
            Demo-only sign-in. It is not real security and protects nothing.
          </span>
        </p>
      </div>

      <Field label="Staff passcode" error={error ?? undefined}>
        {(control) => (
          <input
            {...control}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={passcode}
            onChange={(event) => {
              setPasscode(event.target.value);
              if (error) setError(null);
            }}
            className={`${control.className} tracking-[0.3em]`}
          />
        )}
      </Field>

      <Button type="submit" size="lg" fullWidth>
        Sign in
      </Button>
    </form>
  );
}
