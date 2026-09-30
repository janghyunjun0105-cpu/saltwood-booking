/**
 * ⚠️ DEMO-ONLY AUTH — THIS IS NOT REAL SECURITY.
 *
 * The passcode ships to every browser in the JavaScript bundle, and the
 * "session" is just a flag in sessionStorage that anyone can set by hand.
 * It exists so the portfolio demo has a staff area to click through.
 *
 * Before handling real guest data, replace this with real authentication
 * (e.g. Supabase Auth or Auth.js) and enforce access on the server/database
 * (e.g. Supabase row-level security), not in the browser.
 */
import { createResilientStore, getBrowserSessionStorage } from "@/lib/storage/kvStore";

export const DEMO_PASSCODE = "2468";

const SESSION_KEY = "saltwood:admin-session";
const store = createResilientStore({ getBackend: getBrowserSessionStorage });
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function isAdminSignedIn(): boolean {
  return store.getItem(SESSION_KEY) === "signed-in";
}

/** Returns false when the passcode doesn't match. */
export function signInAdmin(passcode: string): boolean {
  if (passcode.trim() !== DEMO_PASSCODE) return false;
  store.setItem(SESSION_KEY, "signed-in");
  emit();
  return true;
}

export function signOutAdmin() {
  store.removeItem(SESSION_KEY);
  emit();
}

export function subscribeAdminSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Only allow redirects back into the admin area after sign-in. */
export function safeAdminRedirect(next: string | null): string {
  return next && next.startsWith("/admin") && !next.startsWith("//") && !next.startsWith("/admin/login")
    ? next
    : "/admin";
}
