import Link from "next/link";
import CalendarResourceFilter from "@/components/list-tools/calendar-resource-filter";
import { CLOSE_TIME, OPEN_TIME } from "@/lib/config/booking-settings";
import { db } from "@/lib/db";
import {
  addDays,
  addMonths,
  formatDate,
  formatMonthTitle,
  formatPlainDay,
  formatTime,
  minutesInColombo,
  mondayOf,
  toColomboDate,
  toUtc,
  todayInColombo,
} from "@/lib/utils/colombo-time";
import { calendarFilterSchema } from "@/lib/validation";

// One color per resource (same resource = same color everywhere). Full class names for Tailwind.
const CHIP_COLORS = [
  "bg-blue-100 text-blue-900 border-blue-500",
  "bg-emerald-100 text-emerald-900 border-emerald-500",
  "bg-amber-100 text-amber-900 border-amber-500",
  "bg-violet-100 text-violet-900 border-violet-500",
  "bg-rose-100 text-rose-900 border-rose-500",
  "bg-cyan-100 text-cyan-900 border-cyan-500",
  "bg-lime-100 text-lime-900 border-lime-500",
  "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-500",
];
const DOT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-fuchsia-500",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 3;
// Week view: one row per hour, from opening to closing time (D64).
const toMinutes = (t: string) =>
  Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const DAY_START = toMinutes(OPEN_TIME);
const DAY_END = toMinutes(CLOSE_TIME);
const HOUR_PX = 48;

type CalendarEvent = {
  id: string;
  date: string;
  start: Date;
  end: Date;
  resourceName: string;
  color: number;
  userName: string;
  isMine: boolean;
};

type BookingCalendarProps = {
  // Current URL values, so links keep the page's other filters.
  query: Record<string, string | string[] | undefined>;
  basePath: string;
  currentUserId: string;
};

// The hover/tap box: who booked, which resource, what time (no purpose).
function EventTooltip({
  event,
  alignRight,
}: {
  event: CalendarEvent;
  alignRight: boolean;
}) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute top-full z-40 mt-1 hidden w-56 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs font-normal text-gray-700 shadow-lg group-hover/ev:block group-focus/ev:block ${alignRight ? "right-0" : "left-0"}`}
    >
      <span className="block text-sm font-semibold text-gray-900">
        {event.resourceName}
      </span>
      <span className="mt-1 block tabular-nums">
        {formatDate(event.start)}, {formatTime(event.start)}–
        {formatTime(event.end)}
      </span>
      <span className="mt-1 block">
        Booked by {event.userName}
        {event.isMine && " (you)"}
      </span>
    </span>
  );
}

// Shared calendar of ALL confirmed bookings (member home + admin dashboard).
export default async function BookingCalendar({
  query,
  basePath,
  currentUserId,
}: BookingCalendarProps) {
  const { view, date, resource } = calendarFilterSchema.parse(query);
  const today = todayInColombo();
  const anchor = date ?? today;

  // Days on screen. Month: full weeks around the month. Week: Mon–Sun.
  const monthStart = `${anchor.slice(0, 7)}-01`;
  const gridStart = view === "month" ? mondayOf(monthStart) : mondayOf(anchor);
  const gridEnd =
    view === "month"
      ? addDays(mondayOf(addDays(addMonths(monthStart, 1), -1)), 7)
      : addDays(gridStart, 7);
  const days: string[] = [];
  for (let d = gridStart; d < gridEnd; d = addDays(d, 1)) days.push(d);

  // Only this screen's bookings come from the database (fast as data grows).
  const [resources, bookings] = await Promise.all([
    db.resource.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.reservation.findMany({
      where: {
        status: "CONFIRMED",
        startTime: {
          gte: toUtc(gridStart, "00:00"),
          lt: toUtc(gridEnd, "00:00"),
        },
        ...(resource && { resourceId: resource }),
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        userId: true,
        resourceId: true,
        resource: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const colorOf = new Map<string, number>(
    resources.map((r, i) => [r.id, i % CHIP_COLORS.length]),
  );
  const events: CalendarEvent[] = bookings.map((b) => ({
    id: b.id,
    date: toColomboDate(b.startTime),
    start: b.startTime,
    end: b.endTime,
    resourceName: b.resource.name,
    color: colorOf.get(b.resourceId) ?? 0,
    userName: b.user.name,
    isMine: b.userId === currentUserId,
  }));
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events)
    eventsByDay.set(e.date, [...(eventsByDay.get(e.date) ?? []), e]);

  // Links keep the other URL values (e.g. the dashboard's chart choice).
  const href = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query))
      if (typeof v === "string" && v) params.set(k, v);
    for (const [k, v] of Object.entries(changes)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const text = params.toString();
    return text ? `${basePath}?${text}` : basePath;
  };
  const step = (n: number) =>
    view === "month" ? addMonths(anchor, n) : addDays(gridStart, 7 * n);
  const title =
    view === "month"
      ? formatMonthTitle(monthStart)
      : `${formatPlainDay(gridStart)} – ${formatPlainDay(addDays(gridStart, 6))}`;
  // Only resources seen on screen go in the color key.
  const shown = resources.filter((r) =>
    bookings.some((b) => b.resourceId === r.id),
  );

  const navBtn =
    "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50";
  const chip = (e: CalendarEvent) =>
    `group/ev relative flex w-full items-center gap-1 rounded border-l-4 px-1.5 text-left text-[11px] font-medium leading-5 hover:z-30 focus:z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${CHIP_COLORS[e.color]}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Toolbar: title, view switch, month/week arrows, resource filter. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
        <div>
          <h2 className="text-base font-semibold">Booking calendar</h2>
          <p className="text-sm text-gray-500">
            All confirmed bookings. Hover or tap a booking to see who booked it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-lg border border-gray-200 p-0.5"
            role="group"
            aria-label="Calendar view"
          >
            {(["month", "week"] as const).map((v) => (
              <Link
                key={v}
                href={href({ view: v === "month" ? undefined : v })}
                aria-current={view === v ? "true" : undefined}
                scroll={false}
                className={`rounded-md px-3 py-1 text-sm font-medium ${view === v ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {v === "month" ? "Month" : "Week"}
              </Link>
            ))}
          </div>
          <Link
            href={href({ date: step(-1) })}
            scroll={false}
            className={navBtn}
            aria-label="Previous"
          >
            ←
          </Link>
          <Link
            href={href({ date: undefined })}
            scroll={false}
            className={navBtn}
          >
            Today
          </Link>
          <Link
            href={href({ date: step(1) })}
            scroll={false}
            className={navBtn}
            aria-label="Next"
          >
            →
          </Link>
          <span className="min-w-36 px-1 text-sm font-semibold tabular-nums">
            {title}
          </span>
          <CalendarResourceFilter
            resources={resources}
            value={resource ?? ""}
          />
        </div>
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="border-b border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              {w}
            </div>
          ))}
          {days.map((d, i) => {
            const list = eventsByDay.get(d) ?? [];
            const inMonth = d.slice(0, 7) === monthStart.slice(0, 7);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`min-h-24 border-b border-gray-100 p-1 sm:min-h-28 sm:p-1.5 ${i % 7 ? "border-l" : ""} ${d < today ? "bg-gray-50/70" : ""}`}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${isToday ? "bg-brand-600 font-semibold text-white" : inMonth ? "text-gray-700" : "text-gray-300"}`}
                  >
                    {Number(d.slice(8))}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {list.slice(0, MAX_CHIPS).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className={chip(e)}
                      aria-label={`${e.resourceName}, ${formatTime(e.start)} to ${formatTime(e.end)}, booked by ${e.userName}`}
                    >
                      {/* Phones: just a colored bar. Bigger screens: time + resource. */}
                      <span className="hidden truncate sm:inline">
                        {e.isMine && "★ "}
                        {formatTime(e.start)} {e.resourceName}
                      </span>
                      <span className="h-1.5 sm:hidden" />
                      <EventTooltip event={e} alignRight={i % 7 >= 4} />
                    </button>
                  ))}
                  {list.length > MAX_CHIPS && (
                    // Too many for the box: open that week to see them all.
                    <Link
                      href={href({ view: "week", date: d })}
                      scroll={false}
                      className="px-1 text-[11px] font-medium text-brand-700 hover:underline"
                    >
                      +{list.length - MAX_CHIPS} more
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="border-b border-gray-200 bg-gray-50" />
          {days.map((d) => (
            <div
              key={d}
              className={`border-b border-l border-gray-200 bg-gray-50 px-1 py-2 text-center text-xs font-semibold ${d === today ? "text-brand-700" : "text-gray-500"}`}
            >
              <span className="hidden sm:inline">{formatPlainDay(d)}</span>
              <span className="sm:hidden">{Number(d.slice(8))}</span>
            </div>
          ))}

          {/* Hour labels on the left. */}
          <div
            className="relative"
            style={{ height: ((DAY_END - DAY_START) / 60) * HOUR_PX }}
          >
            {Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, h) => (
              <span
                key={h}
                className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-gray-400 first:translate-y-0 sm:text-xs"
                style={{ top: h * HOUR_PX }}
              >
                {String(DAY_START / 60 + h).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {days.map((d, col) => {
            const list = eventsByDay.get(d) ?? [];
            // Side-by-side lanes so bookings at the same time don't cover each other.
            const laneEnds: number[] = [];
            const placed = list.map((e) => {
              const from = minutesInColombo(e.start);
              const to = minutesInColombo(e.end) || 24 * 60;
              let lane = laneEnds.findIndex((end) => end <= from);
              if (lane === -1) lane = laneEnds.length;
              laneEnds[lane] = to;
              return { e, from, to, lane };
            });
            const lanes = Math.max(1, laneEnds.length);
            return (
              <div
                key={d}
                className={`relative border-l border-gray-200 ${d < today ? "bg-gray-50/70" : ""} ${d === today ? "bg-brand-50/40" : ""}`}
                style={{
                  height: ((DAY_END - DAY_START) / 60) * HOUR_PX,
                  backgroundImage:
                    "linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)",
                  backgroundSize: `100% ${HOUR_PX}px`,
                }}
              >
                {placed.map(({ e, from, to, lane }) => (
                  <button
                    key={e.id}
                    type="button"
                    aria-label={`${e.resourceName}, ${formatTime(e.start)} to ${formatTime(e.end)}, booked by ${e.userName}`}
                    className={`group/ev absolute overflow-visible rounded border-l-4 px-1 py-0.5 text-left text-[11px] font-medium leading-tight hover:z-30 focus:z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${CHIP_COLORS[e.color]}`}
                    style={{
                      top:
                        ((Math.max(from, DAY_START) - DAY_START) / 60) *
                        HOUR_PX,
                      height: Math.max(
                        18,
                        ((Math.min(to, DAY_END) - Math.max(from, DAY_START)) /
                          60) *
                          HOUR_PX -
                          2,
                      ),
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                    }}
                  >
                    <span className="hidden truncate sm:block">
                      {e.isMine && "★ "}
                      {formatTime(e.start)}
                    </span>
                    <span className="hidden truncate sm:block">
                      {e.resourceName}
                    </span>
                    <EventTooltip event={e} alignRight={col >= 4} />
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Color key + empty note. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-xs text-gray-600">
        {shown.length === 0 ? (
          <span>No bookings in this {view}.</span>
        ) : (
          shown.map((r) => (
            <span key={r.id} className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${DOT_COLORS[colorOf.get(r.id) ?? 0]}`}
              />
              {r.name}
            </span>
          ))
        )}
        <span className="ml-auto text-gray-500">★ = your booking</span>
      </div>
    </div>
  );
}
