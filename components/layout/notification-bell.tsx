"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BellIcon } from "@/components/layout/app-icons";
import { formatDate, formatTime } from "@/lib/utils/colombo-time";

// D5: ask the server every 30 s (in-app only, no email).
const POLL_MS = 30_000;

type NotificationItem = {
  id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};
type BellData = { unreadCount: number; items: NotificationItem[] };

// Where the list opens: under the navbar bell, or beside the admin sidebar.
const PANEL_POSITION = {
  navbar: "right-0",
  sidebar: "right-0 md:left-0 md:right-auto",
};

type NotificationBellProps = { placement?: keyof typeof PANEL_POSITION };

export default function NotificationBell({
  placement = "navbar",
}: NotificationBellProps) {
  const router = useRouter();
  const [data, setData] = useState<BellData>({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // Offline for a moment: try again next time.
    }
  }, []);

  // First load, then every 30 s; skip while the tab is hidden.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Close on a click outside, or on Esc (focus goes back to the bell).
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function markRead(body: { id: string } | { all: true }) {
    return fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  // Show it as read at once, tell the server, then open the link.
  function openItem(item: NotificationItem) {
    setOpen(false);
    if (!item.isRead) {
      setData((d) => ({
        unreadCount: Math.max(0, d.unreadCount - 1),
        items: d.items.map((n) =>
          n.id === item.id ? { ...n, isRead: true } : n,
        ),
      }));
      markRead({ id: item.id });
    }
    router.push(item.link);
  }

  async function markAllRead() {
    setData((d) => ({
      unreadCount: 0,
      items: d.items.map((n) => ({ ...n, isRead: true })),
    }));
    await markRead({ all: true });
  }

  function toggle() {
    if (!open) load();
    setOpen((o) => !o);
  }

  const unread = data.unreadCount;

  return (
    <div ref={boxRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          unread ? `Notifications, ${unread} unread` : "Notifications"
        }
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white ring-2 ring-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          className={`absolute top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-xl ${PANEL_POSITION[placement]}`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {data.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {data.items.map((item) => {
                const at = new Date(item.createdAt);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        item.isRead ? "" : "bg-brand-50/60"
                      }`}
                    >
                      {/* Blue dot = unread; an empty space keeps text lined up. */}
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          item.isRead ? "" : "bg-brand-600"
                        }`}
                      />
                      <span className="min-w-0">
                        <span
                          className={`block text-sm ${
                            item.isRead
                              ? "text-gray-600"
                              : "font-medium text-gray-900"
                          }`}
                        >
                          {item.message}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {formatDate(at)}, {formatTime(at)}
                          {!item.isRead && (
                            <span className="sr-only"> (unread)</span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
