export const todayHarare = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Harare" });

export type DuesState = "never" | "paid" | "soon" | "overdue";

function monthsBetween(fromISO: string, toISO: string) {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm) + (td > fd ? 1 : 0);
}

export function duesState(paidThrough: string | null, today = todayHarare()) {
  if (!paidThrough) return { state: "never" as DuesState, days: 0, months: 0 };
  const days = Math.round((Date.parse(paidThrough) - Date.parse(today)) / 86400000);
  if (days < 0) return { state: "overdue" as DuesState, days: -days, months: Math.max(1, monthsBetween(paidThrough, today)) };
  if (days <= 7) return { state: "soon" as DuesState, days, months: 0 };
  return { state: "paid" as DuesState, days, months: 0 };
}

export const stateLabel: Record<DuesState, string> = {
  never: "No payments yet",
  paid: "Paid up",
  soon: "Due soon",
  overdue: "Overdue",
};

export const stateTone: Record<DuesState, string> = {
  never: "bg-line text-ink",
  paid: "bg-success text-white",
  soon: "bg-accent text-ink",
  overdue: "bg-primary text-white",
};

export const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

export const money = (n: number | string) => `$${Number(n).toFixed(2)}`;

export async function monthlyDues(supabase: { from: (t: string) => any }): Promise<number | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "monthly_dues_usd").maybeSingle();
  const v = Number(data?.value);
  return Number.isFinite(v) && v > 0 ? v : null;
}
