"use client";

import { useSyncExternalStore } from "react";
import { isAdminSignedIn, subscribeAdminSession } from "@/lib/adminSession";

/** true / false once known in the browser; null during server rendering. */
export function useAdminSession(): boolean | null {
  return useSyncExternalStore(subscribeAdminSession, isAdminSignedIn, () => null);
}
