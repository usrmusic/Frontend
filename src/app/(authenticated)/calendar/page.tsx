"use client";

import { useState, useEffect, useMemo, type CSSProperties } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useCalendar } from "@/src/api/calendar";
import { BackButton } from "@/src/components/Icons";

// A DJ with no colour assigned falls back to neutral grey — matches the
// Users table swatch and the dashboard's mini calendar.
const DJ_FALLBACK_COLOR = "#9CA3AF";

// Solid DJ colour as the chip's actual background — a dense, filled block
// per event (matching the reference calendar), so the colour a DJ was given
// in settings is immediately, unambiguously the colour their events show as.
function djChipStyle(hex?: string | null): CSSProperties {
  return { backgroundColor: hex || DJ_FALLBACK_COLOR };
}

type CalendarEvent = {
  id: number | string;
  date: string;
  start_time?: string;
  end_time?: string;
  name_of_couple?: string;
  users_events_user_idTousers?: { name?: string };
  users_events_dj_idTousers?: { name?: string; color?: string | null } | null;
  venues?: { venue?: string };
};

function formatTime(time?: string): string {
  if (!time) return "";
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m} ${period}`;
}

function getEventDisplayName(ev: CalendarEvent): string {
  return ev.name_of_couple || ev.users_events_user_idTousers?.name || `Event #${ev.id}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Sidebar avatar circle — tinted background + solid text in the DJ's own
// colour (hex + alpha, not color-mix()/rgb() math, so it's guaranteed to
// render even if color-mix() isn't supported), instead of the fixed
// primary-green swatch every DJ previously shared.
function djAvatarStyle(hex?: string | null): CSSProperties {
  const c = hex || DJ_FALLBACK_COLOR;
  return { backgroundColor: `${c}33`, color: c };
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    function onYearChange(e: Event) {
      const ev = e as CustomEvent<{ year: number }>;
      const y = ev?.detail?.year;
      if (y) {
        setYear(y);
        setCurrentMonth((m) => m.year(y));
      }
    }
    window.addEventListener("dashboard:yearChange", onYearChange as EventListener);
    return () => window.removeEventListener("dashboard:yearChange", onYearChange as EventListener);
  }, []);

  const { data: rawData } = useCalendar({ year });

  const events: CalendarEvent[] = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray((rawData as { data?: unknown }).data))
      return (rawData as { data: CalendarEvent[] }).data;
    if (Array.isArray((rawData as { events?: unknown }).events))
      return (rawData as { events: CalendarEvent[] }).events;
    return [];
  }, [rawData]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((ev) => {
      const key = dayjs(ev.date).format("YYYY-MM-DD");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const calendarCells = useMemo(() => {
    const start = currentMonth.startOf("month");
    const end = currentMonth.endOf("month");
    const rawDow = start.day();
    const offset = rawDow === 0 ? 6 : rawDow - 1;
    const cells: { date: dayjs.Dayjs; isCurrentMonth: boolean }[] = [];
    for (let i = offset; i > 0; i--)
      cells.push({ date: start.subtract(i, "day"), isCurrentMonth: false });
    for (let d = 1; d <= end.date(); d++)
      cells.push({ date: currentMonth.date(d), isCurrentMonth: true });
    const trailing = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let i = 1; i <= trailing; i++)
      cells.push({ date: end.add(i, "day"), isCurrentMonth: false });
    return cells;
  }, [currentMonth]);

  const selectedDateEvents = useMemo(
    () => eventsByDate[selectedDate.format("YYYY-MM-DD")] || [],
    [selectedDate, eventsByDate]
  );

  const rows = calendarCells.length / 7;
  const rowClass = rows <= 5 ? "grid-rows-5" : "grid-rows-6";

  return (
    <div className="space-y-4 mt-4">

      {/* ── Page title row — matches other pages (completed-events, etc.) ── */}
      <div className="flex justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <BackButton />
          </Link>
          <h2 className="themeH1">Calendar</h2>
        </div>
      </div>

      {/* ── Calendar wrapper — fixed viewport height, scrollable inside ── */}
      {/* 240px = outer p-6(48) + inner p-8(64) + header(~60) + mt-4(16) + title(32) + space-y-4(16) + spare(4) */}
      <div
        className="flex gap-4 overflow-y-auto no-scrollbar"
        style={{ height: "calc(100vh - 240px)", minHeight: 540 }}
      >

        {/* ────────────────────────────────────────────
            LEFT — Monthly calendar grid (Notion Calendar style)

            Previously each day cell was its OWN bordered, rounded, drop-
            shadowed box sitting inside an ALSO bordered/shadowed outer card —
            "double-boxing": every date looked like a little card floating
            inside a bigger card, which is what read as awkward rather than
            like a calendar. Notion's month grid is the opposite: ONE flat
            surface, divided by hairlines, with a single subtle border around
            the whole thing — no shadows, no per-cell rounding.

            The hairlines themselves aren't borders on every cell (that's
            what caused the boxy look in the first place) — they're the
            container's own background colour showing through 1px gaps
            between white cells, the same trick CSS grid dividers commonly
            use. Only the outer container gets rounded corners + overflow
            hidden, so the whole grid reads as one clipped shape instead of
            49 individually rounded ones. */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">

          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
            <span className="text-xl font-normal text-[#2A2D32] leading-[29px]">
              {currentMonth.format("MMMM YYYY")}
            </span>
            <div className="flex items-center gap-[14.5px]">
              <button
                onClick={() => setCurrentMonth((m) => m.subtract(1, "month"))}
                className="size-[18px] flex items-center justify-center text-[#2A2D32] hover:text-primary transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-xs text-[#2A2D32]">
                {currentMonth.format("YYYY")}
              </span>
              <button
                onClick={() => setCurrentMonth((m) => m.add(1, "month"))}
                className="size-[18px] flex items-center justify-center text-[#2A2D32] hover:text-primary transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Day-of-week headers — a single hairline UNDER the whole row
              (not per-column) is the only divider between this and the
              grid, matching the "one flat surface" treatment below. */}
          <div className="grid grid-cols-7 px-4 shrink-0 border-b border-gray-100">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[#6a7282] text-xs leading-[32.625px]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid — `gap-px` + a light grid background is what
              renders the hairlines; cells contribute no border of their own. */}
          <div className={`grid grid-cols-7 ${rowClass} flex-1 min-h-0 gap-px bg-gray-100`}>
            {calendarCells.map(({ date, isCurrentMonth }, idx) => {
              const dateKey = date.format("YYYY-MM-DD");
              const dayEvents = eventsByDate[dateKey] || [];
              const isSelected = selectedDate.isSame(date, "day");
              const isToday = date.isSame(dayjs(), "day");

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={[
                    "pt-[7.854px] px-[7.854px] pb-[0.604px]",
                    "cursor-pointer flex flex-col gap-[3.625px] transition-colors overflow-hidden",
                    isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50/60",
                  ].join(" ")}
                >
                  {/* Date number — today is plain brand-coloured text (a
                      colour cue, not a shape); a selected OTHER day gets a
                      slim colour ring around just the number rather than
                      tinting the whole cell, which is the more "Notion" way
                      to say "this one's picked" without turning the cell
                      back into a box. */}
                  <div className="shrink-0 h-5 flex items-center">
                    {isToday && isCurrentMonth ? (
                      // Plain coloured text rather than a filled circle (the
                      // reference's "today" treatment), but in the app's own
                      // brand colour, not a generic red — this is a themed
                      // app, not a clone of the reference's palette.
                      <span className="text-xs leading-none font-semibold text-primary">
                        {date.date()}
                      </span>
                    ) : (
                      <span
                        className={`size-5 flex items-center justify-center rounded-full text-xs leading-none ${
                          isSelected ? "ring-1 ring-primary text-primary font-medium" : ""
                        } ${isCurrentMonth ? "text-[#101828]" : "text-[#99a1af]"}`}
                      >
                        {date.date()}
                      </span>
                    )}
                  </div>

                  {/* Event chips — dense, filled colour blocks per event,
                      matching the reference calendar: the DJ's colour fills
                      the whole chip rather than a small dot, and the title
                      wraps onto a second line instead of truncating with an
                      ellipsis (a short block filling most of the cell's
                      width reads better wrapped than clipped). */}
                  {dayEvents.slice(0, 3).map((ev) => {
                    const name = getEventDisplayName(ev);
                    const time =
                      ev.start_time && ev.end_time
                        ? formatTime(ev.start_time)
                        : "";

                    return (
                      <div
                        key={ev.id}
                        className="rounded-[4px] shrink-0 px-1.5 py-1 min-w-0"
                        style={djChipStyle(ev.users_events_dj_idTousers?.color)}
                      >
                        <span className="block text-white text-[11px] font-medium leading-[13px] break-words line-clamp-2">
                          {name}
                        </span>
                        {time && (
                          <span className="block text-white/75 text-[10px] leading-[13px] tabular-nums">
                            {time}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {dayEvents.length > 3 && (
                    <span className="text-[#6b7280] text-[11px] font-medium pl-1.5">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ────────────────────────────────────────────
            RIGHT — Selected-date event panel
        ──────────────────────────────────────────── */}
        <div className="w-[335px] shrink-0 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">

          {/* Panel header */}
          <div className="px-[22.97px] pt-[22.97px] shrink-0">
            {/* Row 1: filter label + add button */}
            <div className="flex items-center justify-between h-[34.457px] mb-[22.97px]">
              <button className="flex items-center gap-1 text-sm text-[#2A2D32] font-normal">
                Events
                <ChevronRight size={15} />
              </button>
              <Link href="/enquiry" className="flex items-center gap-[8px] bg-primary hover:bg-[#7a8e7d] text-white rounded-[9.571px] px-[11.49px] h-full text-sm transition-colors">
                <Plus size={14} />
                <span>Add Event</span>
              </Link>
            </div>

            {/* Selected date sub-header */}
            <div className="flex items-center justify-between pb-[10px] border-b border-[rgba(0,0,0,0.1)]">
              <span className="text-xs text-[#2A2D32] leading-[19px]">
                Events on {selectedDate.format("dddd, MMMM D, YYYY")}
              </span>
              <ChevronRight size={14} className="text-[#2A2D32] shrink-0" />
            </div>
          </div>

          {/* Scrollable event cards — kept as the original bordered card +
              avatar layout (reverted from a flatter list experiment); the
              avatar's tint now comes from the event's own DJ colour instead
              of a fixed primary-green swatch every DJ previously shared. */}
          <div className="flex-1 overflow-y-auto px-[15px] pt-3 pb-4 flex flex-col gap-3 no-scrollbar">
            {selectedDateEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#9ca3af] text-sm gap-2">
                <span className="text-4xl">📅</span>
                <span>No events on this date</span>
              </div>
            ) : (
              selectedDateEvents.map((ev) => {
                const name = getEventDisplayName(ev);
                const venue = ev.venues?.venue || "";
                const time =
                  ev.start_time && ev.end_time
                    ? `${formatTime(ev.start_time)} - ${formatTime(ev.end_time)}`
                    : "";

                return (
                  <Link
                    key={ev.id}
                    href={`/confirmed-events?search=${encodeURIComponent(String(ev.id))}&name=${encodeURIComponent(name)}`}
                    className="block bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    {/* Avatar + name / venue / time — avatar tint now comes
                        from the event's own DJ colour, not a fixed primary
                        swatch every DJ shared. */}
                    <div className="flex gap-[12.159px] items-start px-[14.82px] pt-[15.39px] pb-3">
                      <div
                        className="shrink-0 size-[40.53px] rounded-full flex items-center justify-center"
                        style={djAvatarStyle(ev.users_events_dj_idTousers?.color)}
                      >
                        <span className="text-sm font-semibold">
                          {getInitials(name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base text-[#4a5565] leading-[24.318px] font-normal truncate">
                          {name}
                        </p>
                        {venue && (
                          <p className="text-xs text-[#4a5565] leading-[20.265px] truncate">
                            {venue}
                          </p>
                        )}
                        {time && (
                          <p className="text-[11px] text-[#4a5565] leading-[20.265px]">
                            {time}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Divider + address */}
                    <div className="border-t border-gray-100" />
                    <div className="flex gap-[6px] items-start px-[14.82px] py-[10px]">
                      <MapPin size={12} className="shrink-0 text-[#4a5565] mt-0.5" />
                      <p className="text-[11px] text-[#4a5565] leading-[16.212px]">
                        {venue || "No venue specified"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
