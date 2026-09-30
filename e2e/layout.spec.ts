import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, signInAsStaff } from "./helpers";

const WIDTHS = [360, 390, 414, 768, 1024, 1440];

const PAGES = [
  { name: "home", path: "/", ready: "Plan your visit" },
  { name: "book", path: "/book", ready: "How many guests?" },
  { name: "manage", path: "/manage", ready: "Find my booking" },
  { name: "unknown booking", path: "/book/confirmation/SW-ZZZZ", ready: "We couldn’t find that booking" },
  { name: "staff sign-in", path: "/admin/login", ready: "Demo passcode: 2468" },
  { name: "staff dashboard", path: "/admin", ready: "No-shows", staff: true },
  { name: "staff settings", path: "/admin/settings", ready: "Opening hours", staff: true },
  { name: "404", path: "/this-page-does-not-exist", ready: "We couldn’t find that page" },
];

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    for (const target of PAGES) {
      test(`${target.name}: no sideways scroll, 44px targets, 16px inputs`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        if (target.staff) await signInAsStaff(page);

        const failures: string[] = [];
        page.on("response", (response) => {
          if (response.status() >= 400 && !response.url().includes("this-page-does-not-exist")) {
            failures.push(`${response.status()} ${response.url()}`);
          }
        });
        page.on("pageerror", (error) => failures.push(`page error: ${error.message}`));

        await page.goto(target.path);
        await expect(page.getByText(target.ready).first()).toBeVisible();
        await page.waitForLoadState("networkidle");

        await expectNoHorizontalScroll(page);

        const { checked, smallTargets } = await page.evaluate(() => {
          const selector = [
            "a",
            "button",
            "select",
            "textarea",
            "input:not([type=radio]):not([type=checkbox]):not([type=hidden])",
            "label:has(> input[type=radio])",
            "label:has(input[type=checkbox])",
          ].join(",");
          const targets = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((element) => {
            if (element.closest(".sr-only") || element.classList.contains("sr-only")) return false;
            if (element.getClientRects().length === 0) return false; // not rendered at this width
            // Links inside running text are exempt (WCAG 2.5.8 inline exception).
            return !(element.tagName === "A" && element.closest("p, dd"));
          });
          return {
            checked: targets.length,
            smallTargets: targets
              .filter((element) => {
                const rect = element.getBoundingClientRect();
                return rect.width < 43.5 || rect.height < 43.5;
              })
              .map((element) => {
                const rect = element.getBoundingClientRect();
                const label = (element.getAttribute("aria-label") ?? element.textContent ?? "").trim().slice(0, 40);
                return `<${element.tagName.toLowerCase()}> "${label}" ${Math.round(rect.width)}×${Math.round(rect.height)}`;
              }),
          };
        });
        expect(checked, "the sweep should find interactive elements").toBeGreaterThan(3);
        expect(smallTargets, "touch targets should be at least 44×44px").toEqual([]);

        const smallInputs = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea"))
            .filter((element) => element.getClientRects().length > 0 && !element.classList.contains("sr-only"))
            .filter((element) => parseFloat(getComputedStyle(element).fontSize) < 16)
            .map((element) => element.outerHTML.slice(0, 80)),
        );
        expect(smallInputs, "inputs need a 16px+ font so iOS doesn't zoom").toEqual([]);

        expect(failures, "no failed requests or page errors").toEqual([]);
      });
    }
  });
}
