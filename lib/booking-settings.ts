// Booking rules in one place. Change them here only.
export const OPEN_TIME = "07:00";
export const CLOSE_TIME = "20:00";
export const SLOT_MINUTES = 30;
export const MAX_DAYS_AHEAD = 30;

const toMinutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Every allowed time: "07:00", "07:30", ... "20:00".
export const TIME_SLOTS: string[] = [];
for (
  let m = toMinutes(OPEN_TIME);
  m <= toMinutes(CLOSE_TIME);
  m += SLOT_MINUTES
)
  TIME_SLOTS.push(toTime(m));
