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

// "2026-10-15" + "10:00" in Sri Lanka -> the exact moment.
export function toUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00${UTC_OFFSET}`);
}

// Today in Sri Lanka, e.g. "2026-10-14".
export function todayInColombo() {
  return dateKey.format(new Date());
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
