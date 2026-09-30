import { describe, expect, it } from "vitest";
import { describeServiceStatus, getServiceStatus, summarizeWeeklyHours } from "@/lib/hours";
import { createDefaultSettings } from "@/lib/settings";
import { at } from "./helpers";

describe("weekly hours summary", () => {
  it("groups Tuesday through Sunday and lists Monday as closed", () => {
    const rows = summarizeWeeklyHours(createDefaultSettings());
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ label: "Monday", closed: true });
    expect(rows[1]).toMatchObject({ label: "Tue – Sun", fullLabel: "Tuesday through Sunday", closed: false });
    expect(rows[1].services).toEqual([
      { service: "lunch", label: "Lunch", range: "11:30 AM – 2:00 PM" },
      { service: "dinner", label: "Dinner", range: "5:00 PM – 9:30 PM" },
    ]);
  });

  it("splits a group when one day differs", () => {
    const settings = createDefaultSettings();
    settings.weeklyHours[6].lunch.enabled = false; // Saturday dinner only
    const labels = summarizeWeeklyHours(settings).map((row) => row.label);
    expect(labels).toEqual(["Monday", "Tue – Fri", "Saturday", "Sunday"]);
  });
});

describe("service status", () => {
  const settings = createDefaultSettings();

  it("reports the service being seated right now", () => {
    const now = at("2026-10-06", "12:15");
    const status = getServiceStatus(settings, now);
    expect(status).toEqual({ kind: "serving", service: "lunch", lastSeating: "14:00" });
    expect(describeServiceStatus(status, now)).toBe("Seating for lunch until 2:00 PM");
  });

  it("reports the next seating between services", () => {
    const now = at("2026-10-06", "15:00");
    expect(describeServiceStatus(getServiceStatus(settings, now), now)).toBe("Dinner seating starts at 5:00 PM");
  });

  it("skips closed Mondays", () => {
    const sundayNight = at("2026-10-11", "22:30");
    expect(describeServiceStatus(getServiceStatus(settings, sundayNight), sundayNight)).toBe(
      "Closed now · Opens Tue, Oct 13 at 11:30 AM",
    );
    const mondayNight = at("2026-10-12", "22:30");
    expect(describeServiceStatus(getServiceStatus(settings, mondayNight), mondayNight)).toBe(
      "Closed now · Opens tomorrow at 11:30 AM",
    );
  });
});
