// Times are saved in UTC and shown in Sri Lanka time (D19).
// Sri Lanka has no daylight saving, so the offset never changes.
export const TIME_ZONE = "Asia/Colombo";
const UTC_OFFSET = "+05:30";

const dateKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dayLabel = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const longDay = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// "2026-10-15" + "10:00" in Sri Lanka -> the exact moment.
export function toUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00${UTC_OFFSET}`);
}

// Today in Sri Lanka, e.g. "2026-10-14".
export function todayInColombo() {
  return dateKey.format(new Date());
}

// A moment -> its Sri Lanka date, e.g. "2026-10-15" (for links and forms).
export function toColomboDate(date: Date) {
  return dateKey.format(date);
}

// Time now in Sri Lanka, e.g. "13:45".
export function nowTimeInColombo() {
  return clock.format(new Date());
}

// "2026-10-14" + 30 days -> "2026-11-13".
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// e.g. "10:00"
export function formatTime(date: Date) {
  return clock.format(date);
}

// e.g. "Thu 15 Oct"
export function formatDate(date: Date) {
  return dayLabel.format(date);
}

// e.g. "Thursday 15 October 2026"
export function formatLongDate(date: Date) {
  return longDay.format(date);
}

// e.g. 90 -> "1 hour 30 min"
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourText = hours ? `${hours} hour${hours > 1 ? "s" : ""}` : "";
  const minText = rest ? `${rest} min` : "";
  return [hourText, minText].filter(Boolean).join(" ");
}

// Monday of the week of a plain date, e.g. "2026-10-15" -> "2026-10-12".
export function mondayOf(date: string) {
  // getUTCDay on the plain date: 0 = Sunday ... 6 = Saturday.
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

// Monday of this week in Sri Lanka (weeks are Mon–Sun).
export function weekStartInColombo() {
  return mondayOf(todayInColombo());
}

// "2026-10-15" + 1 month -> "2026-11-01" (always the 1st of the month).
export function addMonths(date: string, months: number) {
  const d = new Date(`${date.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Minutes after midnight in Sri Lanka, e.g. 10:30 -> 630 (for the week view).
export function minutesInColombo(date: Date) {
  const [h, m] = clock.format(date).split(":").map(Number);
  return h * 60 + m;
}

const monthTitle = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});
const plainDay = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

// Plain date labels (no time zone shift): "October 2026" and "Mon 12 Oct".
export function formatMonthTitle(date: string) {
  return monthTitle.format(new Date(`${date}T00:00:00Z`));
}
export function formatPlainDay(date: string) {
  return plainDay.format(new Date(`${date}T00:00:00Z`));
}
