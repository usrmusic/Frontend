"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "antd";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { parseISO } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { Tooltip } from "antd";
import { useAuth } from "@/src/hooks/useAuth";
import { colorPrimaryGradient } from "@/src/config/ThemeConfig";

const sidebarOptions = [
  { label: "Today", getRange: () => [startOfToday(), startOfToday()] },
  {
    label: "This week",
    getRange: () => [
      startOfWeek(startOfToday(), { weekStartsOn: 1 }),
      endOfWeek(startOfToday(), { weekStartsOn: 1 }),
    ],
  },
  {
    label: "Last week",
    getRange: () => {
      const today = startOfToday();
      const lastWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const lastWeek = new Date(lastWeekStart);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return [
        startOfWeek(lastWeek, { weekStartsOn: 1 }),
        endOfWeek(lastWeek, { weekStartsOn: 1 }),
      ];
    },
  },
  {
    label: "Last month",
    getRange: () => {
      const lastMonth = subMonths(startOfMonth(startOfToday()), 1);
      return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
    },
  },
  {
    label: "This year",
    getRange: () => [startOfYear(startOfToday()), endOfYear(startOfToday())],
  },
];

type CalendarEvent = {
  id?: number;
  date: string;
  title?: string;
  couple_name?: string | null;
  venues?: { venue?: string | null } | null;
  users_events_dj_idTousers?: { id?: number; name?: string | null } | null;
};

const getLocalMidday = (d?: string | Date | null) => {
  if (!d) return null;
  let date: Date | null = null;
  if (typeof d === "string") {
    try {
      // parseISO handles date strings consistently (avoids TZ shift for YYYY-MM-DD)
      date = parseISO(d);
    } catch {
      date = new Date(d);
    }
  } else if (d instanceof Date) {
    date = new Date(d.getTime());
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  // set to local midday to avoid DST/offset issues and normalize day
  date.setHours(12, 0, 0, 0);
  return date;
};

const getDateKey = (d?: string | Date | null) => {
  const date = getLocalMidday(d);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function CalendarWithSidebar({
  events,
  isLoading = false,
}: {
  events?: CalendarEvent[];
  isLoading?: boolean;
}) {
  const { data: auth } = useAuth();
  const router = useRouter();
  const [month, setMonth] = useState<Date>(() => startOfToday());
  const [selected, setSelected] = useState<Date>(() => startOfToday());
  const [sidebarIdx, setSidebarIdx] = useState(0);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    (events || []).forEach((event) => {
      const key = getDateKey(event.date);
      if (!key) return;
      const existing = map.get(key) || [];
      map.set(key, [...existing, event]);
    });
    return map;
  }, [events]);

  const dotDays =
    events && events.length
      ? (events
          .map((e) => getLocalMidday(e.date))
          .filter(Boolean) as Date[])
      : [];

  useEffect(() => {
    if (!events || !events.length) return;
    const dates = events
      .map((e) => getLocalMidday(e.date))
      .filter(Boolean) as Date[];
    if (dates.length) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      const firstDate = dates[0];
      const newMonth = startOfMonth(firstDate);
      Promise.resolve().then(() => {
        setMonth((prev) => {
          try {
            return prev.getTime() === newMonth.getTime() ? prev : newMonth;
          } catch {
            return newMonth;
          }
        });
        setSelected((prev) => {
          try {
            return prev && prev.getTime() === firstDate.getTime()
              ? prev
              : firstDate;
          } catch {
            return firstDate;
          }
        });
      });
    }
  }, [events]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  const handleSidebar = (idx: number) => {
    setSidebarIdx(idx);
    const [start] = sidebarOptions[idx].getRange();
    setMonth(start);
    setSelected(start);
  };

  const navigateToCalendar = (isoDate: string) => {
    const perms = (auth?.permissions || []).map((p) => String(p).toLowerCase());
    const hasCalendar =
      perms.includes("calendar") ||
      perms.includes("calendar:view") ||
      perms.includes("access_calendar");
    if (!hasCalendar) {
      import("antd").then(({ notification }) => {
        notification.warning({
          message: "Access denied",
          description: "You don't have permission to view the calendar.",
          placement: "topRight",
        });
      });
      return;
    }
    try {
      router.push(`/calendar?date=${isoDate}`);
    } catch (e) {
      console.error("Navigation error:", e);
    }
  };

  const handleSelectDay = (date: Date | undefined) => {
    if (!date) return;
    setSelected(date);
    navigateToCalendar(getDateKey(date));
  };

  const handlePrev = () => setMonth((prev) => subMonths(prev, 1));
  const handleNext = () => setMonth((prev) => addMonths(prev, 1));
  const monthTitle = month.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const CustomDayButton = (props: DayButtonProps) => {
    const { day, modifiers: _modifiers, ...buttonProps } = props;
    const iso = getDateKey(day.date);
    const dayEvents = eventsByDate.get(iso) || [];

    const button = <button {...buttonProps} />;
    if (!dayEvents.length) return button;

    return (
      <Tooltip
        placement="top"
        title={
          <div className="text-xs leading-snug max-h-64 overflow-auto no-scrollbar">
            {dayEvents.map((ev, idx) => {
              const evTitle =
                ev.couple_name ||
                ev.users_events_dj_idTousers?.name ||
                ev.title ||
                "Event";
              const evVenue = ev.venues?.venue;
              const evDj = ev.users_events_dj_idTousers?.name;
              const evShowDj = evDj && evDj !== evTitle;
              return (
                <div
                  key={ev.id ?? idx}
                  className={idx > 0 ? "mt-2 pt-2 border-t border-white/20" : ""}
                >
                  <div className="font-medium">{evTitle}</div>
                  {evVenue && <div>{evVenue}</div>}
                  {evShowDj && <div className="opacity-80">DJ: {evDj}</div>}
                </div>
              );
            })}
          </div>
        }
      >
        {button}
      </Tooltip>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row overflow-hidden">
      <div className="flex flex-row sm:flex-col sm:w-32 py-4 sm:py-6 px-3 sm:pl-4 sm:pr-2 gap-1 sm:gap-0 overflow-x-auto">
        {sidebarOptions.map((opt, idx) => (
          <button
            key={opt.label}
            className={`shrink-0 text-left px-3 py-2 rounded-md mb-0 sm:mb-1 text-[13px] font-medium transition-all ${
              idx === sidebarIdx
                ? "text-white shadow-sm"
                : "text-gray-500 hover:bg-[#e5e5e5]"
            }`}
            style={
              idx === sidebarIdx
                ? { background: colorPrimaryGradient }
                : undefined
            }
            onClick={() => handleSidebar(idx)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="h-px sm:h-auto sm:w-px bg-gray-200 mx-3 sm:mx-2 sm:my-6" />
      <div className="flex-1 min-w-0 py-4 sm:py-6 pr-4 sm:pr-6 pl-2">
        <div className="flex items-center justify-between mb-2">
          <button
            aria-label="Previous month"
            onClick={handlePrev}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-all hover:bg-[#e5e5e5]"
            style={{ border: "none" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 19l-7-7 7-7"
                stroke="#222"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="text-lg font-semibold text-gray-900">
            {monthTitle}
          </div>
          <button
            aria-label="Next month"
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-all hover:bg-[#e5e5e5]"
            style={{ border: "none" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 5l7 7-7 7"
                stroke="#222"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelectDay}
          onDayClick={(day: Date) => {
            setSelected(day);
            navigateToCalendar(getDateKey(day));
          }}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          weekStartsOn={1}
          locale={enGB}
          className="bg-transparent! w-full"
          classNames={{
            table: "w-full table-fixed border-collapse",
            head_row: "table-row",
            head_cell: "table-cell py-2 text-center text-[12px] text-gray-400",
            row: "table-row",
            cell: "table-cell align-top p-0",
            day: "transition-all cursor-pointer text-[13px] text-gray-700",
            day_selected:
              "bg-primary text-blue-600 font-semibold bg-white rounded-md inline-flex items-center justify-center",
            day_today: "bg-gray-100 text-gray-900 font-semibold rounded-md",
            day_outside: "text-gray-300",
            day_disabled: "text-gray-300",
          }}
          modifiers={{ dot: dotDays }}
          modifiersClassNames={{
            dot: "relative after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-600",
          }}
          components={{ MonthCaption: () => <></>, DayButton: CustomDayButton }}
        />
      </div>
    </div>
  );
}

export default CalendarWithSidebar;
