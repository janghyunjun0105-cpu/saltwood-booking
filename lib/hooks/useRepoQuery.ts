"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { BookingRepository } from "@/lib/storage/bookingRepo";
import { loadBookingRepo } from "@/lib/storage/lazy";

interface QueryState<T> {
  key: string | null;
  data: T | undefined;
  error: Error | null;
}

/**
 * Loads data from the repository and reloads it whenever the repository
 * reports a change (in this tab or another). `key` identifies the query;
 * when it changes, the previous data stays visible until the new data lands.
 */
export function useRepoQuery<T>(key: string, fetcher: (repo: BookingRepository) => Promise<T>) {
  const [state, setState] = useState<QueryState<T>>({ key: null, data: undefined, error: null });
  const [version, setVersion] = useState(0);
  const load = useEffectEvent(async () => fetcher(await loadBookingRepo()));

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    loadBookingRepo().then((repo) => {
      if (active) unsubscribe = repo.subscribe(() => setVersion((current) => current + 1));
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setState({ key, data, error: null });
      },
      (error: unknown) => {
        if (active) {
          setState((previous) => ({
            key,
            data: previous.data,
            error: error instanceof Error ? error : new Error("Something went wrong loading data."),
          }));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [key, version]);

  return {
    data: state.data,
    error: state.error,
    /** True until the first result for the current key arrives. */
    isLoading: state.key !== key,
  };
}
