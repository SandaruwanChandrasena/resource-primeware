import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/layout/app-icons";
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

// One solid color per resource (same resource = same color everywhere). Full class names for Tailwind.
const CHIP_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-orange-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-cyan-700",
  "bg-lime-700",
  "bg-fuchsia-600",
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

// Shared calendar of ALL confirmed bookings (member home + admin Calendar page).
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

  const chip = (e: CalendarEvent) =>
    `group/ev relative flex w-full items-center rounded-md px-2 py-0.5 text-left text-xs font-semibold leading-5 text-white shadow-sm hover:z-30 hover:brightness-110 focus:z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 ${CHIP_COLORS[e.color]}`;
  const label = (e: CalendarEvent) =>
    `${e.resourceName}, ${formatTime(e.start)} to ${formatTime(e.end)}, booked by ${e.userName}`;
  const gridHeight = ((DAY_END - DAY_START) / 60) * HOUR_PX;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      {/* Toolbar: big title left; filter, view switch, Today and arrows right. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight tabular-nums">
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarResourceFilter
            resources={resources}
            value={resource ?? ""}
          />
          <div
            role="group"
            aria-label="Calendar view"
            className="flex rounded-full bg-gray-100 p-1"
          >
            {(["month", "week"] as const).map((v) => (
              <Link
                key={v}
                href={href({ view: v === "month" ? undefined : v })}
                aria-current={view === v ? "true" : undefined}
                scroll={false}
                className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                {v === "month" ? "Month" : "Week"}
              </Link>
            ))}
          </div>
          <Link
            href={href({ date: undefined })}
            scroll={false}
            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </Link>
          <Link
            href={href({ date: step(-1) })}
            scroll={false}
            aria-label={view === "month" ? "Previous month" : "Previous week"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
          <Link
            href={href({ date: step(1) })}
            scroll={false}
            aria-label={view === "month" ? "Next month" : "Next week"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {view === "month" ? (
        // No overflow-hidden: the hover boxes must be able to go outside a day.
        <div className="grid grid-cols-7 rounded-xl border border-gray-200">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`border-b border-gray-200 bg-gray-100 py-2.5 text-center text-xs font-semibold sm:text-sm ${i ? "border-l" : "rounded-tl-xl"} ${i === 6 ? "rounded-tr-xl text-red-600" : "text-gray-600"}`}
            >
              {w}
            </div>
          ))}
          {days.map((d, i) => {
            const list = eventsByDay.get(d) ?? [];
            const inMonth = d.slice(0, 7) === monthStart.slice(0, 7);
            const isToday = d === today;
            const isSunday = i % 7 === 6;
            const lastRow = i >= days.length - 7;
            return (
              <div
                key={d}
                className={`relative min-h-24 p-1 sm:min-h-28 sm:p-1.5 ${i % 7 ? "border-l border-gray-200" : ""} ${lastRow ? "" : "border-b border-gray-200"} ${inMonth ? "bg-white" : "bg-gray-100/70"} ${isToday ? "z-10 bg-brand-50 ring-2 ring-inset ring-brand-600" : ""} ${lastRow && i % 7 === 0 ? "rounded-bl-xl" : ""} ${lastRow && isSunday ? "rounded-br-xl" : ""}`}
              >
                <div className="mb-1.5 flex justify-center">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums ${isToday ? "bg-brand-600 font-semibold text-white" : !inMonth ? "text-gray-400" : isSunday ? "font-medium text-red-600" : "font-medium text-gray-800"}`}
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
                      aria-label={label(e)}
                    >
                      {/* Phones: a thin colored bar. Bigger screens: time + resource. */}
                      <span className="hidden truncate sm:inline">
                        {e.isMine && "★ "}
                        {formatTime(e.start)} {e.resourceName}
                      </span>
                      <span className="h-1 sm:hidden" />
                      <EventTooltip event={e} alignRight={i % 7 >= 4} />
                    </button>
                  ))}
                  {list.length > MAX_CHIPS && (
                    // Too many for the box: open that week to see them all.
                    <Link
                      href={href({ view: "week", date: d })}
                      scroll={false}
                      className="px-1 text-xs font-medium text-gray-600 hover:text-brand-700 hover:underline"
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
        <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] rounded-xl border border-gray-200 sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="rounded-tl-xl border-b border-gray-200 bg-gray-100" />
          {days.map((d, i) => {
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`flex flex-col items-center gap-0.5 border-b border-l border-gray-200 bg-gray-100 py-2 text-xs font-semibold sm:text-sm ${i === 6 ? "rounded-tr-xl text-red-600" : "text-gray-600"}`}
              >
                <span>{WEEKDAYS[i]}</span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full tabular-nums ${isToday ? "bg-brand-600 text-white" : ""}`}
                >
                  {Number(d.slice(8))}
                </span>
              </div>
            );
          })}

          {/* Hour labels on the left. */}
          <div className="relative" style={{ height: gridHeight }}>
            {Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, h) => (
              <span
                key={h}
                className="absolute right-1.5 mt-1 text-[10px] tabular-nums text-gray-400 sm:text-xs"
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
                className={`relative border-l border-gray-200 ${d === today ? "bg-brand-50" : d < today ? "bg-gray-100/50" : ""}`}
                style={{
                  height: gridHeight,
                  backgroundImage:
                    "linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
                  backgroundSize: `100% ${HOUR_PX}px`,
                }}
              >
                {placed.map(({ e, from, to, lane }) => (
                  <button
                    key={e.id}
                    type="button"
                    aria-label={label(e)}
                    className={`group/ev absolute rounded-md px-1.5 py-1 text-left text-xs font-semibold leading-tight text-white shadow-sm hover:z-30 hover:brightness-110 focus:z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 ${CHIP_COLORS[e.color]}`}
                    style={{
                      top:
                        ((Math.max(from, DAY_START) - DAY_START) / 60) *
                          HOUR_PX +
                        1,
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
                      {formatTime(e.start)}–{formatTime(e.end)}
                    </span>
                    <span className="hidden truncate font-medium opacity-90 sm:block">
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

      {/* Color key (one dot per resource on screen) + empty note. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
        {shown.length === 0 ? (
          <span>No bookings in this {view}.</span>
        ) : (
          shown.map((r) => (
            <span key={r.id} className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${CHIP_COLORS[colorOf.get(r.id) ?? 0]}`}
              />
              {r.name}
            </span>
          ))
        )}
        <span className="ml-auto text-gray-500">
          ★ = your booking · Hover or tap a booking for details
        </span>
      </div>
    </div>
  );
}
