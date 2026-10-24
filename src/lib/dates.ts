// Events use Zimbabwe time (CAT, UTC+2, no daylight saving).
const TZ = "Africa/Harare";

export const fmtEventDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const fmtEventTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

export const dayNumber = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric" });

export const monthShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, month: "short" });

// <input type="datetime-local"> value <-> ISO (Zimbabwe time)
export const toLocalInput = (iso: string) => new Date(new Date(iso).getTime() + 2 * 3600e3).toISOString().slice(0, 16);
export const fromLocalInput = (v: string) => new Date(`${v}:00+02:00`).toISOString();

export const fmtHoliday = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "long", year: "numeric" });

export const categoryLabel: Record<string, string> = {
  kenya_club: "Kenya Club",
  fun_day: "Fun Day",
  community: "Community",
  embassy: "Embassy",
  other: "Event",
};
