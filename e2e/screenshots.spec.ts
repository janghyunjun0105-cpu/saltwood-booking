/**
 * `npm run screenshots` — builds the app, starts it and saves portfolio PNGs to /screenshots.
 *
 * Each device gets a fresh browser context (so freshly seeded demo data), and the page clock is
 * set to the coming Thursday at 7:10 PM Austin time, mid dinner service. That way the dashboard
 * shows a realistic mix of seated, finished and upcoming tables no matter when this runs.
 */
import { expect, test, type Page } from "@playwright/test";
import { addDaysToDateKey, restaurantTimeToInstant, weekdayOf } from "../lib/time";
import { fillGuest, pickDate, pickRadio, restaurantToday, signInAsStaff } from "./helpers";

const THURSDAY = 4;

function comingThursday(): string {
  let date = addDaysToDateKey(restaurantToday(), 1);
  while (weekdayOf(date) !== THURSDAY) date = addDaysToDateKey(date, 1);
  return date;
}

const fakeToday = comingThursday();
// The seed sells out Friday 7:00 PM and leaves one table at 7:30 PM (see lib/seed.ts).
const showcase = addDaysToDateKey(fakeToday, 1);

const DEVICES = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false },
  { name: "mobile", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true },
] as const;

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

for (const device of DEVICES) {
  test(`${device.name} screenshots`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: device.viewport,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile,
      hasTouch: device.isMobile,
      locale: "en-US",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.clock.install({ time: restaurantTimeToInstant(fakeToday, "19:10") });
    const shot = (name: string) => page.screenshot({ path: `screenshots/${device.name}-${name}.png` });

    // Home
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Saltwood Kitchen", level: 1 })).toBeVisible();
    await settle(page);
    await shot("home");

    // Booking step 2: the showcase date has a sold-out and a nearly full slot.
    await page.goto("/book");
    await pickRadio(page, "party-size", "2");
    await pickDate(page, showcase);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("radio", { name: "7:00 PM, full" })).toBeDisabled();
    await pickRadio(page, "time", "18:30");
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await shot("booking-times");

    // Confirmation
    await page.getByRole("button", { name: "Continue" }).click();
    await fillGuest(page, {
      firstName: "Avery",
      lastName: "Collins",
      email: "avery.collins@example.com",
      phone: "(512) 555-0199",
    });
    await page.getByLabel("Occasion").selectOption("anniversary");
    await page.getByLabel("Special requests").fill("Celebrating 5 years. Quiet table if you have one.");
    await page.getByRole("button", { name: "Confirm booking" }).click();
    await expect(page.getByRole("heading", { name: "You’re booked, Avery!" })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await shot("confirmation");

    // Staff dashboard for "today" (table on desktop, cards on mobile).
    await signInAsStaff(page);
    await page.goto("/admin");
    await expect(page.getByText("No-shows", { exact: true })).toBeVisible();
    await expect(page.getByText("Today", { exact: true }).first()).toBeVisible();
    await settle(page);
    await shot(device.isMobile ? "admin-cards" : "admin");

    await context.close();
  });
}
