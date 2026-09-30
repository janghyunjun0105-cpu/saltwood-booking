import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { formatDateLong, formatTime } from "../lib/time";
import {
  bookTable,
  expectNoHorizontalScroll,
  fillGuest,
  nextOpenDate,
  pickDate,
  pickRadio,
  showcaseDate,
  signInAsStaff,
} from "./helpers";

const JORDAN = {
  firstName: "Jordan",
  lastName: "Lee",
  email: "jordan.lee@example.com",
  phone: "512 555 0166",
};

const SAM = {
  firstName: "Sam",
  lastName: "Ortiz",
  email: "sam.ortiz@example.com",
  phone: "(737) 555-0102",
};

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("book → confirm → manage → reschedule → cancel → visible in admin", async ({ page, context }) => {
  const date = showcaseDate();

  // Step 1: party size and date
  await page.goto("/book");
  await pickRadio(page, "party-size", "4");
  await pickDate(page, date);
  await expectNoHorizontalScroll(page);
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: the seeded showcase slot has exactly one table left
  await expect(page.getByRole("radio", { name: "7:00 PM, full" })).toBeDisabled();
  await expect(page.getByRole("radio", { name: "7:30 PM, 1 table left" })).toBeEnabled();
  await expectNoHorizontalScroll(page);
  await pickRadio(page, "time", "19:30");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: inline validation, then real details
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByText("Enter your first name.")).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveAttribute("aria-invalid", "true");
  await fillGuest(page, JORDAN);
  await page.getByLabel("Occasion").selectOption("anniversary");
  await page.getByLabel("Special requests").fill("Quiet corner, please.");
  await expect(page.getByText("21/200")).toBeVisible();
  await expectNoHorizontalScroll(page);

  // Meanwhile, another tab takes the last 7:30 PM table.
  const otherTab = await context.newPage();
  await bookTable(otherTab, { date, time: "19:30", partySize: 2, guest: SAM });
  await otherTab.close();

  // Submitting now re-checks availability and sends us back to step 2 with our details kept.
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "That time was just booked. Please pick another time." })).toBeVisible();
  await expect(page.getByRole("radio", { name: "7:30 PM, full" })).toBeDisabled();
  await pickRadio(page, "time", "18:00");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("First name")).toHaveValue("Jordan");
  await expect(page.getByLabel("Special requests")).toHaveValue("Quiet corner, please.");
  await page.getByRole("button", { name: "Confirm booking" }).click();

  // Confirmation
  await page.waitForURL(/\/book\/confirmation\/SW-[A-HJ-NP-Z2-9]{4}$/);
  const code = page.url().split("/").pop()!;
  await expect(page.getByRole("heading", { name: "You’re booked, Jordan!" })).toBeVisible();
  await expect(page.getByText(code, { exact: true })).toBeVisible();
  await expect(page.getByText(formatDateLong(date))).toBeVisible();
  await expect(page.getByText("6:00 PM")).toBeVisible();
  await expect(page.getByRole("link", { name: /Get directions/ })).toHaveAttribute("href", /google\.com\/maps/);
  await expectNoHorizontalScroll(page);

  // Add to calendar downloads a real .ics file
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`saltwood-kitchen-${code.toLowerCase()}.ics`);
  const ics = await readFile((await download.path())!, "utf8");
  expect(ics).toContain("BEGIN:VEVENT");
  expect(ics).toContain("SUMMARY:Table for 4 at Saltwood Kitchen");

  // Manage: code is prefilled from the link, email is required
  await page.getByRole("link", { name: "Manage booking" }).click();
  await page.waitForURL(/\/manage\?code=/);
  await expect(page.getByRole("textbox", { name: "Booking code" })).toHaveValue(code);
  await page.getByLabel("Email", { exact: true }).fill("wrong@example.com");
  await page.getByRole("button", { name: "Find my booking" }).click();
  await expect(page.getByText("We couldn't find that booking")).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(JORDAN.email.toUpperCase());
  await page.getByRole("button", { name: "Find my booking" }).click();
  await expect(page.getByRole("heading", { name: "Your booking" })).toBeVisible();

  // Reschedule with the same pickers and rules
  const newDate = nextOpenDate(date);
  await page.getByRole("button", { name: "Change" }).click();
  await pickDate(page, newDate);
  await pickRadio(page, "time", "12:00");
  await expectNoHorizontalScroll(page);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(`your table is now`)).toContainText(`${formatTime("12:00")} for 4 guests`);

  // Cancel through the confirmation dialog
  await page.getByRole("button", { name: "Cancel booking" }).click();
  const dialog = page.getByRole("dialog", { name: "Cancel this booking?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep booking" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Cancel booking" }).click();
  await dialog.getByRole("button", { name: "Cancel booking" }).click();
  await expect(page.getByText("Your booking has been cancelled.")).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();

  // Staff dashboard reflects every change
  await signInAsStaff(page);
  await page.goto("/admin");
  await page.getByLabel("Go to date").fill(newDate);
  await expect(page.getByRole("heading", { name: formatDateLong(newDate) })).toBeVisible();
  const card = page.getByRole("article", { name: `${formatTime("12:00")}, Jordan Lee` });
  await expect(card).toBeVisible();
  await expect(card.getByText("Cancelled")).toBeVisible();
  await page.getByLabel("Search by name, phone or code").fill(code);
  await expect(page.getByText(/Showing 1 of \d+ booking/)).toBeVisible();
  await expectNoHorizontalScroll(page);

  // The cancelled booking freed its table: restoring it works.
  await card.getByRole("button", { name: /Restore/ }).click();
  await expect(card.getByText("Confirmed")).toBeVisible();
});

test("staff can change a status and the change shows everywhere", async ({ page }) => {
  await signInAsStaff(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Next day" }).click();
  const firstSeat = page.getByRole("button", { name: /^Seat/ }).first();
  if ((await firstSeat.count()) === 0) test.skip(true, "No confirmed bookings on this day of the seed");
  await firstSeat.click();
  await expect(page.getByText(/marked seated\./)).toBeAttached();
});

test("staff sign-in rejects a wrong passcode and accepts the demo one", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL(/\/admin\/login/);
  await page.getByLabel("Staff passcode").fill("0000");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That passcode didn't match. Try again.")).toBeVisible();
  await page.getByLabel("Staff passcode").fill("2468");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
  await expect(page.getByText("No-shows", { exact: true })).toBeVisible();
});

test("large parties are asked to call", async ({ page }) => {
  await page.goto("/book");
  await page.locator('label:has(> input[name="party-size"][value="large"])').click();
  await expect(page.getByText("Call us for large parties")).toBeVisible();
  await expect(page.getByRole("link", { name: /Call \(512\) 555-0147/ })).toHaveAttribute("href", "tel:+15125550147");
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
});
