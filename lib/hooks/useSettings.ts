"use client";

import { DEFAULT_SETTINGS } from "@/lib/settings";
import { useRepoQuery } from "@/lib/hooks/useRepoQuery";

/** Current settings. Falls back to the defaults until storage has been read (and during SSR). */
export function useSettings() {
  const { data, isLoading, error } = useRepoQuery("settings", (repo) => repo.getSettings());
  return { settings: data ?? DEFAULT_SETTINGS, isLoading, error };
}
