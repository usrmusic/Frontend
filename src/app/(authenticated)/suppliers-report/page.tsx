"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, Export, MagnifyingGlass } from "@/src/components/Icons";
import { DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { MoreVertical, RefreshCw, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useColumns from "./useColumns";
import { useSuppliersReport } from "@/src/api/reports";
import SkeletonInput from "antd/es/skeleton/Input";
import { useEffect, useState } from "react";

interface StatItem {
  label: string;
  value: string;
  image: string;
  imageAlt: string;
  variant: "white" | "green";
  icon?: string;
  toggleKey?: "totalPaidStat" | "totalCostStat" | "remainingMoneyStat";
}

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
  event_status: "",
  event_start_time: "",
  event_end_time: "",
  year: new Date().getFullYear(),
};

const money = (value: unknown) => `£${Number(value ?? 0).toFixed(2)}`;

const SuppliersPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEventStatus, setSelectedEventStatus] = useState<string>(initialParams.event_status || "");

  // Same global year picker the Dashboard listens to (Header.tsx) — the
  // Laravel report always scopes its stat cards to a selected year, so this
  // page needs to react to it too instead of only ever showing "this year."
  useEffect(() => {
    const handler: EventListener = (ev) => {
      const custom = ev as CustomEvent<{ year?: number }>;
      const y = custom?.detail?.year;
      if (typeof y === "number" && !Number.isNaN(y)) {
        setParams((prev) => ({ ...prev, year: y, page: 1 }));
      }
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

  const { data: suppliersReportData, isLoading } = useSuppliersReport(params);

  const { columns } = useColumns();

  const [showStat, setShowStat] = useState({
    totalPaidStat: false,
    totalCostStat: false,
    remainingMoneyStat: false,
  });

  const statsData = suppliersReportData?.stats;
  // Five cards, matching the legacy Laravel report exactly: Events count,
  // Remaining events (Confirmed only), Total Cost, Total Paid, and Remaining
  // (money) — the two "Remaining" cards are genuinely different metrics
  // (count vs money) that just happen to share a label there too.
  const stats: StatItem[] = [
    {
      label: "Events",
      value: String(statsData?.count ?? "—"),
      image: "/svgs/stat-icon.svg",
      imageAlt: "stat",
      variant: "white",
    },
    {
      label: "Remaining",
      value: String(statsData?.remainingEvents ?? "—"),
      image: "/svgs/red-chart.svg",
      imageAlt: "stat",
      variant: "white",
      icon: "/svgs/list-icon.svg",
    },
    {
      label: "Total Cost",
      value: money(statsData?.totalCost),
      image: "/svgs/Line-chart.svg",
      imageAlt: "stat",
      variant: "green",
      toggleKey: "totalCostStat",
    },
    {
      label: "Total Paid",
      value: money(statsData?.totalPaid),
      image: "/svgs/red-chart.svg",
      imageAlt: "stat",
      variant: "white",
      toggleKey: "totalPaidStat",
    },
    {
      label: "Remaining",
      value: money(statsData?.remaining),
      image: "/svgs/red-chart.svg",
      imageAlt: "stat",
      variant: "white",
      toggleKey: "remainingMoneyStat",
    },
  ];

  const resetFilters = () => {
    setParams(initialParams);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSelectedEventStatus("");
  };

  const applyFilters = () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search,
      event_start_time: dateFrom,
      event_end_time: dateTo,
      event_status: selectedEventStatus || "",
    }));
  };
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="">
            <BackButton />
          </Link>
          <h2 className="themeH1">Suppliers Report</h2>
        </div>
        <div className="flex gap-2">
          {/* <Button icon={<Export />}>Export Data</Button> */}
          {/* Dead button — no onClick, does nothing.
          <Button>
            <MoreVertical size={18} />
          </Button>
          */}
        </div>
      </div>
      {/* `auto-fit` fixed the overflow (each card now gets at least the
          230px it needs — see the sizing math below) but left an odd-item
          side effect: 5 cards at 230px+ naturally pack 3-per-row, and the
          leftover 2 sat at their normal card width on their own row,
          leaving a slab of dead space beside them instead of using it.

          This grid is hard-coded to exactly 5 known stats (not dynamic data
          — `stats` above is a fixed literal array), so unlike a generic
          "however many items happen to exist" grid, a deliberate layout for
          those 5 can be stated directly instead of guessed at: a 6-column
          track lets the first 3 cards each take 2 columns (3-per-row) and
          the last 2 each take 3 columns — the same total width (6 units)
          divided differently, so row two fills edge-to-edge instead of
          stopping halfway. If a 6th stat is ever added this stops being
          exact and needs revisiting; it isn't a generic solution, it's this
          specific row's known shape.

          Sizing floor: a card needs roughly 230px (40px icon + label/value
          text + the 18px eye toggle + gap + the 52px trailing chart image +
          padding). `lg:grid-cols-6` (col-span-2 = 1/3 of the row) is only
          safe once there's enough width for that — the original bug was
          exactly this check being skipped. Below `lg`, `sm:grid-cols-2`
          keeps 2 per row (each ≈288px+ at `sm`, comfortably clear of the
          230px floor), with the 5th card spanning both columns as a full-
          width closer rather than a lone half-width island. Below `sm`,
          everything stacks full width — always safe at any card content
          size. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        {stats.map((item, index) => {
          const statKey = item.toggleKey;
          const isToggleable = Boolean(statKey);
          const isVisible = statKey ? Boolean(showStat[statKey]) : true;
          const iconColor = item.variant === "green" ? "#fff" : undefined;
          // Index 4 is the last of 5 — full width at the 2-col `sm` tier
          // (closes the row instead of sitting alone beside empty space);
          // indices 3-4 are the "wide" pair at the 6-col `lg` tier — see the
          // layout note above the grid.
          const spanClass =
            index === 4
              ? "sm:col-span-2 lg:col-span-3"
              : index === 3
                ? "lg:col-span-3"
                : "lg:col-span-2";

          return (
            <Card
              key={`${item.label}-${index}`}
              variant={item.variant}
              className={`flex items-center justify-between ${spanClass}`}
              onClick={
                isToggleable && !isLoading && statKey
                  ? () =>
                      setShowStat((prev) => ({
                        ...prev,
                        [statKey]: !prev[statKey],
                      }))
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <Image src={item.icon} alt="icon" width={40} height={40} />
                )}
                <div>
                  <p
                    className={`text-sm ${item.variant === "green" ? "text-white" : "text-primary"}`}
                  >
                    {item.label}
                  </p>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-xl font-semibold ${item.variant === "green" ? "text-white" : "text-black"} ${isToggleable && !isVisible ? "blur-sm" : ""}`}
                      >
                        {item.value}
                      </p>
                      {isToggleable &&
                        (isVisible ? (
                          <EyeOff size={18} color={iconColor} />
                        ) : (
                          <Eye size={18} color={iconColor} />
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <Image
                src={item.image}
                alt={item.imageAlt}
                width={52}
                height={39}
              />
            </Card>
          );
        })}
      </div>
      <div className="rounded-2xl overflow-hidden">
        {/* Was `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5` — a fixed
            column count assumed to divide evenly at each breakpoint, which
            was the same mistake as the stat-card grid above it: at `lg`
            (1024px), 5 equal columns work out to ~187px each, but this row
            holds a search box, a select whose placeholder alone reads
            "Confirmed and Completed Events", two date pickers, AND a 2-button
            pair — none of which fit in 187px. A previous fix (col-span
            juggling per breakpoint) patched the button pair's specific
            symptom but left the Select and both DatePickers just as
            squeezed, which is why Reset Filters was still visibly clipped.

            `flex-wrap` + a `min-w` per control is the same pattern already
            proven correct on Admin Report's identical filter bar (see that
            page — it even has more controls than this one and doesn't break
            at any width): each control states the narrowest it can
            comfortably render at, and wraps onto a new line the moment the
            row can't fit it anymore, at ANY viewport, not just the specific
            widths a breakpoint happens to land on. */}
        <div className="bg-primary p-4 flex flex-wrap gap-2">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[220px] max-w-full">
            <Select
              allowClear
              placeholder="Confirmed and Completed Events"
              className="w-full h-10 bg-white rounded-lg text-xs"
              value={selectedEventStatus || undefined}
              onChange={(val) => setSelectedEventStatus(String(val || ""))}
              options={[
                { label: "Confirmed and Completed Events", value: "" },
                { label: "Confirmed Events", value: "confirmed" },
                { label: "Completed Events", value: "completed" },
              ]}
            />
          </div>
          <DatePicker
            placeholder="Date (From)"
            className="flex-1 min-w-[140px] h-10 !bg-white"
            value={dateFrom ? dayjs(dateFrom) : null}
            onChange={(_, dateString) =>
              setDateFrom(Array.isArray(dateString) ? dateString[0] || "" : dateString)
            }
          />
          <DatePicker
            placeholder="Date (To)"
            className="flex-1 min-w-[140px] h-10 !bg-white"
            value={dateTo ? dayjs(dateTo) : null}
            onChange={(_, dateString) =>
              setDateTo(Array.isArray(dateString) ? dateString[0] || "" : dateString)
            }
          />
          {/* `h-full!` (height: 100% !important) only resolves against a
              parent that has a DEFINITE height. This flex row has none of its
              own — it's sized by its content — so "100% of an auto height"
              is exactly the kind of percentage CSS treats as indeterminate
              and falls back to `auto` for, silently making `h-full!` a no-op.
              `h-10!` states the same 40px directly instead, matching the
              Search box's explicit height, so it can't drift regardless of
              what height the row resolves to.

              `flex-1`: every OTHER control in this row (Search, Select, both
              DatePickers) is `flex-1`, so they stretch to divide up the full
              row between them with no gap left over — this pair was the one
              exception, sized only to its own content, and sat flush left
              with a slab of dead green space trailing it when alone on a
              line. Matching it to `flex-1` makes it behave like its
              siblings: full width whenever it's alone on a line, sharing
              evenly when it isn't.

              No `min-w` floor, and `flex-wrap` added: a `min-width` doesn't
              shrink below its stated value even under `flex-wrap`, so a
              floor here (this pair used to carry `min-w-[280px]`, "to keep
              the pair together as a unit") becomes the overflow itself once
              a phone is narrower than that floor — the same bug that
              clipped Admin Report's "Columns" button. The pair is already
              ONE flex item in the outer row, so it already moves as a unit
              with no floor forcing it; `flex-wrap` here is just the
              internal fallback if this pair's own two buttons ever don't
              fit side by side on a genuinely tiny screen. */}
          <div className="flex-1 flex flex-wrap gap-2">
            <Button className="flex-1 h-10!" onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button
              className="flex-1 h-10!"
              icon={<RefreshCw size={14} />}
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          dataSource={suppliersReportData?.result}
          pagination={{
            pageSize: params.perPage,
            current: params.page,
            total: suppliersReportData?.total,
            onChange: (page, pageSize) =>
              setParams({ ...params, page, perPage: pageSize }),
          }}
          rowKey={(data) => data.id}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default SuppliersPage;
