"use client";

import { useSyncExternalStore } from "react";
import { getRestaurantNow, type RestaurantNow } from "@/lib/time";

const TICK_MS = 15_000;

let snapshot: RestaurantNow | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function refresh() {
  const next = getRestaurantNow();
  if (snapshot && snapshot.date === next.date && snapshot.minutes === next.minutes) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  refresh();
  timer ??= setInterval(refresh, TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): RestaurantNow {
  snapshot ??= getRestaurantNow();
  return snapshot;
}

function getServerSnapshot(): RestaurantNow | null {
  return null;
}

/**
 * The restaurant's clock, updated every few seconds so past slots disappear on
 * their own. Returns null during server rendering and hydration, because the
 * server can't know when the page will be viewed.
 */
export function useRestaurantNow(): RestaurantNow | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
