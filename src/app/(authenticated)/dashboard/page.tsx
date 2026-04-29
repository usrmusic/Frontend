"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Image from "next/image";
import dynamic from "next/dynamic";
import { colorPrimaryGradient } from "@/src/config/ThemeConfig";

import { useState, useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type CustomComponents } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  addMonths,
  subMonths,
  startOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { useDashboard, useUpcomingEvents, UpcomingEvent } from "@/src/api/dasboard";
import { Spin, Skeleton, Table, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useDebounce } from "@/src/hooks/useDebounce";
import { Eye, EyeOff } from "lucide-react";

// Sidebar options for calendar (must be outside any component)
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

// Type for open enquiry items used in this page
type OpenEnquiry = {
  id?: number | string;
  couple_name?: string | null;
  date?: string | null;
  client?: { name?: string | null } | null;
  venue?: string | null;
  subtitle?: string | null;
  created_at?: string | null;
  tag?: string | null;
  users_events_dj_idTousers?: { id?: number; name?: string | null } | null;
  users_events_user_idTousers?: { id?: number; name?: string | null } | null;
  [key: string]: unknown;
};

// Safe date formatter: accepts string|number|Date and returns formatted string or empty
const formatDate = (v?: string | number | Date | null) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v as string | number);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }
  if (v instanceof Date) {
    return Number.isNaN(v.getTime())
      ? ""
      : v.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }
  return "";
};

function CalendarWithSidebar({
  events,
}: {
  events?: Array<{ id?: number; date: string; title?: string }>;
}) {
  const router = useRouter();
  const [month, setMonth] = useState<Date>(() => startOfToday());
  const [selected, setSelected] = useState<Date>(() => startOfToday());
  const [sidebarIdx, setSidebarIdx] = useState(0);
  const lastClickRef = useRef<{ time: number; date: string | null }>({
    time: 0,
    date: null,
  });

  // Build a fast lookup set of event dates (YYYY-MM-DD) for rendering dots
  const toLocalIso = (d?: Date | string | null) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    if (!date || Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const dotSet = new Set(
    (events || []).map((e) => toLocalIso(e.date)).filter(Boolean) as string[],
  );

  // Also prepare Day objects for DayPicker modifiers (use midday UTC to avoid TZ shifts)
  const dotDays =
    events && events.length
      ? (events
          .map((e) => {
            try {
              const dt = new Date(e.date);
              dt.setHours(12, 0, 0, 0);
              return dt;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as Date[])
      : [];

  // When events arrive, show the month containing the earliest event
  useEffect(() => {
    if (!events || !events.length) return;
    const dates = events
      .map((e) => {
        try {
          const dt = new Date(e.date);
          dt.setHours(12, 0, 0, 0);
          return dt;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Date[];
    if (dates.length) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      const firstDate = dates[0];
      const newMonth = startOfMonth(firstDate);
      // Defer updates to a micro-task and use functional updates that avoid changing
      // state when the value is already the same. This prevents unnecessary cascading renders.
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

  // Sidebar click handler
  const handleSidebar = (idx: number) => {
    setSidebarIdx(idx);
    const [start] = sidebarOptions[idx].getRange();
    setMonth(start);
    setSelected(start);
  };

  // Handle day selection with reliable double-click detection using a ref
  const handleSelectDay = (date: Date | undefined) => {
    if (!date) return;
    const now = Date.now();
    const isoDate = date.toISOString().split("T")[0];
    const isDoubleClick =
      lastClickRef.current.date === isoDate &&
      now - (lastClickRef.current.time || 0) < 400;

    setSelected(date);
    lastClickRef.current = { time: now, date: isoDate };
    if (isDoubleClick) {
      try {
        router.push(`/calendar?date=${isoDate}`);
      } catch (e) {
        console.error("Navigation error:", e);
      }
    }
  };
  const handlePrev = () => setMonth((prev) => subMonths(prev, 1));
  const handleNext = () => setMonth((prev) => addMonths(prev, 1));
  const monthTitle = month.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  // Custom Day renderer to show a small dot when an event exists on that date.
  const CustomDay = (dayProps: Record<string, unknown>) => {
    const date = dayProps["date"] as Date | undefined;
    const children = dayProps["children"] as React.ReactNode;
    const className = (dayProps["className"] as string) || "";
    const iso = toLocalIso(date as Date | undefined);
    const hasDot = dotSet.has(iso);
    return (
      <td className={(className || "") + " align-top p-0"}>
        <div className="relative flex items-center justify-center w-full h-full">
          <span>{children}</span>
          {hasDot && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600" />
          )}
        </div>
      </td>
    );
  };

  // suppress DayPicker caption; provide our custom Day component
  const dayPickerComponents = {
    Caption: () => null,
    Day: CustomDay,
  } as unknown as Partial<CustomComponents>;

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="flex flex-col w-32 py-6 pl-4 pr-2">
        {sidebarOptions.map((opt, idx) => (
          <button
            key={opt.label}
            className={`text-left px-3 py-2 rounded-md mb-1 text-[13px] font-medium transition-all ${
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
      {/* Divider */}
      <div className="w-px bg-gray-200 my-6 mx-2" />
      {/* Calendar */}
      <div className="flex-1 py-6 pr-6 pl-2 max-w-[70%]">
        {/* Custom header */}
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
            const iso = toLocalIso(day);
            const now = Date.now();
            const isDouble =
              lastClickRef.current.date === iso &&
              now - (lastClickRef.current.time || 0) < 400;

            setSelected(day);
            lastClickRef.current = { time: now, date: iso };
            if (isDouble) {
              try {
                router.push(`/calendar?date=${iso}`);
              } catch (err) {
                console.error(err);
              }
            }
          }}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          weekStartsOn={1}
          locale={enGB}
          className="bg-transparent!"
          classNames={{
            table: "w-full table-fixed border-collapse",
            head_row: "table-row",
            head_cell: "table-cell py-2 text-center text-[12px] text-gray-400",
            row: "table-row",
            cell: "table-cell align-top p-0",
            day: "transition-all cursor-pointer text-[13px] text-gray-700",
            // selected as an outline ring with white background so it appears like an outlined circle
            day_selected:
              "bg-primary text-blue-600 font-semibold bg-white rounded-md inline-flex items-center justify-center",
            // today as a subtle filled circle
            day_today: "bg-gray-100 text-gray-900 font-semibold rounded-md",
            day_outside: "text-gray-300",
            day_disabled: "text-gray-300",
          }}
          modifiers={{ dot: dotDays }}
          modifiersClassNames={{
            dot: "relative after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-600",
          }}
          components={dayPickerComponents}
        />
      </div>
    </div>
  );
}
// react-apexcharts renders only on client — use dynamic import
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
// ensure a loosely-typed reference for JSX usage without `any`
const ApexChart: ComponentType<Record<string, unknown>> =
  ReactApexChart as unknown as ComponentType<Record<string, unknown>>;

// NOTE: using API-driven dashboard data; removed local demo events

// Chart series + options for Event Overview
const chartSeries = [
  {
    name: "This month",
    data: [140, 160, 150, 180, 220, 200, 230, 250, 240, 260, 240, 270],
  },
  {
    name: "Last month",
    data: [160, 170, 165, 190, 240, 220, 210, 230, 220, 240, 230, 250],
  },
];

type ChartOptionsType = {
  xaxis?: { categories?: unknown[] } & Record<string, unknown>;
  [k: string]: unknown;
};

const chartOptions = {
  chart: {
    id: "events-overview",
    toolbar: { show: false },
    zoom: { enabled: false },
    sparkline: { enabled: false },
  },
  colors: ["#16A34A", "#CBD5E1"],
  stroke: { curve: "smooth", width: [3, 3] },
  fill: {
    type: "gradient",
    gradient: {
      shade: "light",
      inverseColors: false,
      gradientToColors: ["#16A34A"],
      opacityFrom: 0.28,
      opacityTo: 0.02,
      stops: [0, 90, 100],
    },
  },
  grid: { borderColor: "#f1f1f1" },
  xaxis: {
    categories: Array.from({ length: 12 }, (_, i) => i + 1),
    labels: { show: true, style: { colors: "#9CA3AF", fontSize: "10px" } },
    axisTicks: { show: false },
    axisBorder: { show: false },
    crosshairs: {
      show: true,
      stroke: { color: "#D1D5DB", width: 1, dashArray: 4 },
    },
  },
  yaxis: {
    show: true,
    labels: {
      style: { colors: "#D1D5DB", fontSize: "10px" },
      formatter: (val: number) => `${val}`,
    },
  },
  markers: {
    size: 6,
    colors: ["#16A34A"],
    strokeColors: "#fff",
    strokeWidth: 3,
    hover: { size: 8 },
  },
  dataLabels: {
    enabled: true,
    enabledOnSeries: [0],
    offsetY: -10,
  },
  tooltip: {
    enabled: true,
    followCursor: true,
    theme: "dark",
    custom: function (opts: {
      series: unknown;
      seriesIndex: number;
      dataPointIndex: number;
      w?: Record<string, unknown>;
    }) {
      const { series, seriesIndex, dataPointIndex, w } = opts;
      let value: unknown = undefined;
      if (
        Array.isArray(series) &&
        Array.isArray((series as unknown[])[seriesIndex as number])
      ) {
        const row = (series as unknown[])[seriesIndex as number] as unknown[];
        value = row[dataPointIndex as number];
      }
      const wObj = w as Record<string, unknown> | undefined;
      const globals = wObj?.globals as Record<string, unknown> | undefined;
      const labels = globals?.labels as unknown[] | undefined;
      const category = Array.isArray(labels)
        ? labels[dataPointIndex as number]
        : dataPointIndex + 1;
      const numeric = Number(value as unknown);
      return `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="background:${colorPrimaryGradient};color:white;padding:10px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.12);font-size:12px;min-width:120px;text-align:center;">
            <div style="font-weight:700;font-size:14px;line-height:1">${Number(numeric).toLocaleString()}</div>
            <div style="opacity:0.95;font-size:11px;margin-top:4px">${category}</div>
          </div>
          <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid ${colorPrimaryGradient};position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);"></div>
        </div>
      `;
    },
  },
} as ChartOptionsType;

const DashboardPage = () => {
  const router = useRouter();

  const [showStat, setShowStat] = useState({
    eventStat: false,
    remainingStat: false,
    profitStat: false,
    turnOverStat: false,
  });

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const handler: EventListener = (ev) => {
      const custom = ev as CustomEvent<{ year?: number }>;
      const y = custom?.detail?.year;
      if (typeof y === "number" && !Number.isNaN(y)) setYear(y);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("dashboard:yearChange", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dashboard:yearChange", handler);
      }
    };
  }, []);

  useEffect(() => {
    // Defer mounting flag update to a micro-task so we don't synchronously
    // call setState inside the effect body which can trigger cascading renders.
    Promise.resolve().then(() => {
      setIsMounted((prev) => (prev === true ? prev : true));
    });
  }, []);

  const { data: dashboard, isLoading: dashboardLoading } = useDashboard({
    year,
  });

  // Upcoming events search + data
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const debouncedUpcoming = useDebounce(upcomingSearch, 500);
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingEvents(
    debouncedUpcoming.trim().length > 0 ? { search: debouncedUpcoming.trim() } : {}
  );

  const monthlyCounts = dashboard?.monthly?.counts ?? [];
  const monthlyLabels = dashboard?.monthly?.labels ?? [];
  const countsChange =
    monthlyCounts.length >= 2
      ? Math.round(
          ((monthlyCounts[monthlyCounts.length - 1] -
            monthlyCounts[monthlyCounts.length - 2]) /
            Math.max(1, monthlyCounts[monthlyCounts.length - 2])) *
            100,
        )
      : undefined;
  const completedPercent = dashboard
    ? Math.round(
        ((dashboard.confirmedEventsCount ?? 0) /
          Math.max(1, dashboard.totalEvents ?? 1)) *
          100,
      )
    : undefined;

  // Sales analytics derived data
  const djCountsObj = dashboard?.salesAnalytics?.djCounts ?? {};
  const djEntries = Object.entries(djCountsObj)
    .map(([name, count]) => ({ name, count: Number(count ?? 0) }))
    .filter((d) => d.name && !Number.isNaN(d.count))
    .sort((a, b) => b.count - a.count);
  const totalDjCount = djEntries.reduce((s, d) => s + d.count, 0);
  const topDjs = djEntries.slice(0, 3);
  const eventOverviewKey = `ov-${monthlyLabels.join("-")}-${monthlyCounts.join("-")}-${isMounted ? "M" : "U"}`;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex gap-6">
        {/* <div className="grid grid-cols-4 gap-4"> */}
        {/* Events total */}
        <Card
          variant="white"
          className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        >
          {dashboardLoading ? (
            <div className="w-full flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div className="mt-4 flex-1">
                <p className="text-base text-primary">Events</p>
                <div>
                  <p
                    className={`text-2xl font-semibold ${!showStat.eventStat ? "blur-sm" : ""}`}
                  >
                    {dashboard?.totalEvents ?? 0}
                  </p>
                  <button
                    onClick={() =>
                      setShowStat((prev) => ({
                        ...prev,
                        eventStat: !prev.eventStat,
                      }))
                    }
                  >
                    {showStat.eventStat ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
              <Image
                src={"/svgs/stat-icon.svg"}
                alt="Events"
                width={20}
                height={20}
                className="flex-1"
              />
            </>
          )}
        </Card>
        {/* Remaining */}
        <Card
          variant="white"
          className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        >
          {dashboardLoading ? (
            <div className="w-full flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Image
                src={"/svgs/list-icon.svg"}
                alt="Remaining"
                width={28}
                height={28}
                className="flex-1"
              />
              <div className="mt-4 flex-1">
                <p className="text-base text-primary">Remaining</p>
                <p
                  className={`text-2xl font-semibold ${!showStat.remainingStat ? "blur-sm" : ""}`}
                >
                  {dashboard?.pendingPayments?.length ?? 0}
                </p>
                <button
                  onClick={() =>
                    setShowStat((prev) => ({
                      ...prev,
                      remainingStat: !prev.remainingStat,
                    }))
                  }
                >
                  {showStat.remainingStat ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              <Image
                src={"/svgs/red-chart.svg"}
                alt="Remaining"
                width={28}
                height={28}
                className="flex-1"
              />
            </>
          )}
        </Card>
        {/* open enquiry */}
        <Card
          variant="white"
          className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        >
          {dashboardLoading ? (
            <div className="w-full flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Image
                src={"/svgs/Icon.svg"}
                alt="Open Enquiry"
                width={28}
                height={28}
                className="flex-1"
              />
              <div className="mt-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-base text-primary">Turn Over</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/open-enquiry")}
                  className={`text-2xl font-semibold hover:underline ${!showStat.turnOverStat ? "blur-sm" : ""}`}
                >
                  {dashboardLoading
                    ? "..."
                    : new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                        maximumFractionDigits: 0,
                      }).format(dashboard?.totalTurnover ?? 0)}
                </button>
                <button
                  onClick={() =>
                    setShowStat((prev) => ({
                      ...prev,
                      turnOverStat: !prev.turnOverStat,
                    }))
                  }
                >
                  {showStat.turnOverStat ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              <Image
                src={"/svgs/red-chart.svg"}
                alt="Open Enquiry"
                width={28}
                height={28}
                className="flex-1"
              />
            </>
          )}
        </Card>
        {/* Profit */}
        <Card
          variant="green"
          className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        >
          {dashboardLoading ? (
            <div className="w-full flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-base text-white/80 mb-2">Profit</p>
                </div>
                <p
                  className={`text-2xl font-semibold text-white ${!showStat.profitStat ? "blur-sm" : ""}`}
                >
                  {dashboardLoading
                    ? "..."
                    : new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                        maximumFractionDigits: 0,
                      }).format(dashboard?.totalProfit ?? 0)}
                </p>
                <button
                  onClick={() =>
                    setShowStat((prev) => ({
                      ...prev,
                      profitStat: !prev.profitStat,
                    }))
                  }
                >
                  {showStat.profitStat ? (
                    <EyeOff size={20} color="#fff" />
                  ) : (
                    <Eye size={20} color="#fff" />
                  )}
                </button>
              </div>
              <Image
                src={"/svgs/Line-chart.svg"}
                alt="line chart"
                width={74}
                height={55}
                className="flex-1"
              />
            </>
          )}
        </Card>
        {/* </div> */}
      </div>
      {/* Top grid: Event Overview + right side stats */}
      <div className="grid grid-cols-12 gap-6 items-stretch h-full min-h-[340px]">
        {/* Event Overview */}
        <div
          className="col-span-12 xl:col-span-6 p-0! overflow-hidden rounded-3xl bg-white"
          style={{ boxShadow: "0px 1px 3px 0px #0000001A" }}
        >
          <div className="flex items-center justify-between  p-4 text-white rounded-t-3xl">
            <div className="flex items-center gap-3">
              <h4 className="font-poppins font-medium text-black">
                Event Overview
              </h4>
              {/* <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Active
              </span> */}
            </div>
            <div className="w-72">
              <Input
                placeholder="Search upcoming events"
                allowClear
                onChange={(e) => setUpcomingSearch(e.target.value)}
                value={upcomingSearch}
                size="middle"
              />
            </div>
          </div>

          <div className="p-4">
            {/* <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search event"
                className="w-full rounded-full border border-gray-300 px-4 h-10 text-sm bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="sr-only">{filteredEvents.length} results</span>
            </div> */}
            {/* <h3 className="text-sm">Event Overview</h3> */}
            <div className="overflow-hidden rounded-2xl border border-gray-50 p-3">
              <div className="grid grid-cols-12 items-center gap-4">
                <div className="col-span-12">
                  <div className="flex flex-row gap-3">
                    {/* <div className="rounded-xl bg-white p-4 shadow-sm flex-1">
                      <p className="text-xs text-gray-400">Total Events</p>
                      <p className="text-lg font-semibold">
                        {dashboardLoading
                          ? "..."
                          : (dashboard?.totalEvents ?? 0)}
                        <span
                          className={`ml-2 text-sm ${countsChange && countsChange > 0 ? "text-emerald-600" : "text-rose-500"}`}
                        >
                          {countsChange === undefined
                            ? ""
                            : `${countsChange > 0 ? "+" : ""}${countsChange}%`}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm flex-1">
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-lg font-semibold">
                        {dashboardLoading
                          ? "..."
                          : (dashboard?.confirmedEventsCount ?? 0)}
                        <span className="ml-2 text-sm text-emerald-600">
                          {completedPercent === undefined
                            ? ""
                            : `${completedPercent}%`}
                        </span>
                      </p>
                    </div> */}
                  </div>
                </div>
                <div className="col-span-12">
                  {/* Replace chart with Upcoming Events table. Show spinner when dashboard or upcoming events are loading. */}
                  { (dashboardLoading || upcomingLoading) ? (
                    <div className="h-44 flex items-center justify-center">
                      <Spin size="large" />
                    </div>
                  ) : (
                      <div className="max-h-[300px] overflow-auto no-scrollbar">
                        {/* Typed columns for upcoming events */}
                        {/** Columns typed to `UpcomingEvent` so no `any` needed */}
                        {(() => {
                          const upcomingColumns: ColumnsType<UpcomingEvent> = [
                            {
                              title: "Date",
                              key: "date",
                              render: (_text: unknown, record: UpcomingEvent) => {
                                const d = record?.date || (record as any)?.event_date || (record as any)?.eventDate;
                                return d ? new Date(d).toLocaleDateString("en-GB") : "";
                              },
                            },
                            {
                              title: "Venue",
                              key: "venue",
                              render: (_text: unknown, record: UpcomingEvent) => record?.venue_name || (record as any)?.venue || "",
                            },
                            {
                              title: "DJ Name",
                              key: "dj_name",
                              render: (_text: unknown, record: UpcomingEvent) => record?.dj_name || (record as any)?.dj?.name || "",
                            },
                          ];

                          return (
                            <Table<UpcomingEvent>
                              size="small"
                              pagination={false}
                              dataSource={upcomingData || []}
                              rowKey={(r) => r.id}
                              columns={upcomingColumns}
                            />
                          );
                        })()}
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column stats */}
        <section className="col-span-12 xl:col-span-6 flex flex-col gap-4 h-full">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch h-full">
            {/* Sales Analytics (driven by API) */}
            <Card
              variant="white"
              className="shadow-sm p-4 flex flex-col h-full"
            >
              <div className="mb-2 gap-2 flex flex-col">
                <p className="text-base font-semibold text-gray-800">
                  Sales Analytics
                </p>
                <p className="text-xs text-gray-400">Events Progress</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-gray-900">
                    {dashboardLoading
                      ? "..."
                      : (dashboard?.confirmedEventsCount ?? 0)}
                  </span>
                  <span className="text-xs text-gray-400">
                    /{dashboardLoading ? "..." : (dashboard?.totalEvents ?? 0)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedPercent === undefined
                    ? ""
                    : `${completedPercent}% Events Completed`}
                </p>
              </div>

              <div className="flex flex-1 items-center gap-2 mt-2 justify-between">
                <div className="flex-1 flex flex-col justify-center h-full">
                  {dashboardLoading ? (
                    <div className="h-20 flex items-center">
                      <Skeleton
                        active
                        title={false}
                        paragraph={{ rows: 3, width: [120, 90, 80] }}
                      />
                    </div>
                  ) : !djEntries.length ? (
                    <div className="text-xs text-gray-500">
                      No sales analytics data available.
                    </div>
                  ) : (
                    <ul className="text-xs space-y-4">
                      {topDjs.map((d, i) => {
                        const pct = totalDjCount
                          ? Math.round((d.count / totalDjCount) * 100)
                          : 0;
                        const colors = [
                          "bg-red-400",
                          "bg-blue-400",
                          "bg-emerald-500",
                        ];
                        return (
                          <li key={d.name} className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${colors[i] || "bg-gray-300"} block`}
                            />
                            <div className="flex gap-2 flex-col items-start">
                              <span className="text-gray-700">{d.name}</span>
                              <span className="text-gray-500">
                                {pct}% · {d.count} events
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="shrink-0 flex-1 flex items-center justify-center">
                  {/* Donut chart showing DJ breakdown (top DJs + Other) */}
                  {(() => {
                    const top = djEntries.slice(0, 3);
                    const topSum = top.reduce((s, d) => s + d.count, 0);
                    const other = Math.max(0, totalDjCount - topSum);
                    const labels = top
                      .map((d) => d.name)
                      .concat(other > 0 ? ["Other"] : []);
                    const series = top
                      .map((d) => d.count)
                      .concat(other > 0 ? [other] : []);
                    // use similar green shades with slight differences
                    const colors = ["#7A9683", "#98B79A", "#BFE0C7", "#E6EFE7"];
                    const hasData = series.some((v) => v > 0);
                    if (dashboardLoading) {
                      return (
                        <div
                          style={{ width: 160, height: 160 }}
                          className="flex items-center justify-center"
                        >
                          <Spin size="large" />
                        </div>
                      );
                    }
                    return isMounted ? (
                      <ApexChart
                        key={`donut-${year}-${labels.join("-")}-${series.join("-")}`}
                        options={{
                          chart: {
                            animations: {
                              enabled: true,
                              easing: "easeinout",
                              speed: 600,
                            },
                            toolbar: { show: false },
                          },
                          labels,
                          colors: colors.slice(0, labels.length),
                          legend: { show: false },
                          dataLabels: { enabled: false },
                          tooltip: { enabled: true },
                          plotOptions: {
                            pie: {
                              donut: {
                                size: "65%",
                                labels: {
                                  show: true,
                                  name: { show: false },
                                  value: {
                                    show: true,
                                    formatter: (val: unknown) => String(val),
                                  },
                                  total: {
                                    show: true,
                                    label: "Total",
                                    formatter: () => `${totalDjCount}`,
                                  },
                                },
                              },
                            },
                          },
                          stroke: { show: true, width: 6, lineCap: "round" },
                        }}
                        series={hasData ? series : [1]}
                        type="donut"
                        width={160}
                        height={160}
                      />
                    ) : (
                      <div style={{ width: 160, height: 160 }} />
                    );
                  })()}
                </div>
              </div>
            </Card>

            {/* Pending Payments (from API) */}
            <Card variant="white" className="flex flex-col h-full">
              <div className="flex flex-col flex-1 justify-start h-full">
                <p className="mb-3 text-base font-medium">Pending Payment</p>
                {dashboardLoading ? (
                  <div className="w-full pt-3 flex items-center justify-center">
                    <Skeleton active />
                  </div>
                ) : !dashboard?.pendingPayments?.length ? (
                  <div className="text-xs text-gray-500">
                    No pending payments.
                  </div>
                ) : (
                  <ul className="space-y-2 no-scrollbar text-xs flex-1 max-h-[300px] overflow-auto">
                    {dashboard.pendingPayments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between py-2 border-b border-[#636363] cursor-pointer hover:bg-gray-50 transition-colors"
                        title={`Double-click to search in header`}
                        onDoubleClick={() => {
                          const clientName =
                            p.client_name ?? p.couple_name ?? `Client #${p.id}`;
                          const eventId = p.id;
                          const status = Number(p.event_status_id);
                          let target = "/dashboard";
                          if (status === 1) target = "/open-enquiry";
                          else if (status === 2) target = "/confirmed-events";
                          else if (status === 3 || status === 4)
                            target = "/completed-events";
                          try {
                            router.push(
                              `${target}?search=${encodeURIComponent(String(eventId))}&name=${encodeURIComponent(String(clientName))}`,
                            );
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                      >
                        <div>
                          <p>{p.client_name ?? `Client #${p.id}`}</p>
                          <p className="text-[11px] text-gray-400">
                            {p.payment_date
                              ? new Date(p.payment_date).toLocaleDateString()
                              : "No date"}{" "}
                            · {p.outstanding ? `£${p.outstanding}` : ""}
                          </p>
                        </div>
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-medium text-rose-500">
                          Pending
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* Bottom grid: Open Enquiry + Calendar + Activities */}
      <div className="grid grid-cols-12 gap-6 pb-4">
        {/* Open Enquiry (from API) */}
        <Card
          variant="white"
          className="col-span-12 lg:col-span-5 shadow-sm p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900">
              Open Enquiry (
              {dashboardLoading ? (
                "..."
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/open-enquiry")}
                  className="text-primary underline font-semibold"
                >
                  {dashboard?.openEnquiriesCount ?? dashboard?.openEnquiries?.length ?? 0}
                </button>
              )}
              )
            </p>
          </div>
          {dashboardLoading ? (
            <div className="h-44 flex items-center justify-center">
              <Skeleton active />
            </div>
          ) : !dashboard?.openEnquiries?.length ? (
            <div className="text-xs text-gray-500">No open enquiries.</div>
          ) : (
            <ul className="space-y-2 no-scrollbar text-xs max-h-[300px] overflow-auto">
              {dashboard.openEnquiries.map((enq: OpenEnquiry, idx: number) => {
                const djName =
                  enq.users_events_dj_idTousers?.name ??
                  enq.couple_name ??
                  "Unknown";
                const clientName =
                  enq.users_events_user_idTousers?.name ??
                  enq.client?.name ??
                  "";
                const secondary =
                  clientName ||
                  enq.venue ||
                  enq.subtitle ||
                  (enq.created_at ? formatDate(enq.created_at) : "");
                const badgeText = enq.date
                  ? formatDate(enq.date)
                  : (enq.tag ?? "New");

                return (
                  <li
                    key={String(enq.id ?? enq.couple_name ?? `enq-${idx}`)}
                    className="flex items-center border-b border-[#636363] last:border-0 justify-between px-3 py-3"
                    onDoubleClick={() => {
                      try {
                        const clientName =
                          enq.users_events_user_idTousers?.name ??
                          enq.client?.name ??
                          enq.couple_name ??
                          "";
                        const eventId = enq.id ?? "";
                        router.push(
                          `/open-enquiry?search=${encodeURIComponent(String(eventId))}&name=${encodeURIComponent(String(clientName))}&select=${encodeURIComponent(String(eventId))}`,
                        );
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <Image
                        src={"/images/avatar.png"}
                        alt="avatar"
                        width={30}
                        height={30}
                        className="rounded-lg"
                      />
                      <div>
                        <p className="text-gray-900">{djName}</p>
                        <p className="text-[11px] text-gray-400">{secondary}</p>
                      </div>
                    </div>
                    <div
                      className="rounded-sm px-2 text-center py-1 text-[10px] font-medium text-white min-w-[84px] whitespace-nowrap"
                      style={{ background: colorPrimaryGradient }}
                    >
                      {badgeText}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Calendar */}
        <Card
          variant="white"
          className="dashboard-calendar col-span-12 lg:col-span-4 shadow-sm p-0 rounded-2xl bg-[#F6F5F0]"
        >
          <CalendarWithSidebar events={dashboard?.calendarEvents} />
        </Card>

        {/* Events activity */}
        <Card
          variant="white"
          className="col-span-12 lg:col-span-3 flex flex-col"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Events Activity
              </p>
            </div>
          </div>
          <ul className="mb-4 no-scrollbar space-y-2 text-xs max-h-[280px] overflow-auto">
            {dashboardLoading ? (
              <li className="flex items-center">
                <Skeleton active paragraph={false} />
              </li>
            ) : !dashboard?.recentNotes?.length ? (
              <li className="text-xs text-gray-500">No recent notes.</li>
            ) : (
              dashboard.recentNotes.map((note) => (
                <li key={note.id} className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary mt-1" />
                  <div>
                    <div className="text-gray-700">
                      {note.notes?.slice(0, 80) || "—"}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {note.created_by ?? "System"} ·{" "}
                      {note.created_at
                        ? new Date(note.created_at).toLocaleString()
                        : ""}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          {/* <Button
            type="primary"
            className="h-10! mt-auto w-full"
            style={{ background: colorPrimaryGradient }}
          >
            View All Activities
          </Button> */}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
