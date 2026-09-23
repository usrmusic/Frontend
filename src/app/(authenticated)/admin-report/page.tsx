"use client";
import { useState } from "react";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { DatePicker, Select, Dropdown, Checkbox } from "antd";
import { RefreshCw, Eye, EyeOff, Columns3 } from "lucide-react";
import { useDebounce } from "@/src/hooks/useDebounce";
import Image from "next/image";
import Link from "next/link";
import useColumns, {
  COLUMN_LABELS,
  DEFAULT_VISIBLE_COLUMNS,
  SORTABLE_COLUMNS,
  type AdminReportSort,
} from "./useColumns";
import { useAdminReport } from "@/src/api/reports";
import SkeletonInput from "antd/es/skeleton/Input";
import dayjs from "dayjs";

interface StatItem {
  label: string;
  value: string;
  image: string;
  imageAlt?: string;
  variant?: "white" | "green";
}

const initialParams = {
  page: 1,
  perPage: 10,
};

export type Filters = {
  page: number;
  perPage: number;
  search?: string;
  event_status?: string;
  event_start_time?: string;
  event_end_time?: string;
  company_name?: string;
  dj_name?: string;
  venue_name?: string;
  event_date?: string;
  total_price?: string;
  cost?: string;
  extra_cost?: string;
  profit?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
};

const Page = () => {
  const [filters, setFilters] = useState<Filters>(initialParams);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEventStatus, setSelectedEventStatus] = useState<string>("");
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const debouncedColFilters = useDebounce(colFilters, 600);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [sortState, setSortState] = useState<AdminReportSort>(null);

  // Merge base filters with debounced column filters at query time — no cascading setState
  const activeFilters: Filters = {
    ...filters,
    ...Object.fromEntries(Object.entries(debouncedColFilters).filter(([, v]) => !!v)),
    // Column key -> the `sort_by` the API understands (they differ for DJ and
    // Event Status); omitted entirely when nothing is sorted, so the backend
    // keeps its own default ordering.
    ...(sortState
      ? {
          sort_by: SORTABLE_COLUMNS.get(sortState.field) ?? sortState.field,
          sort_dir: (sortState.order === "ascend" ? "asc" : "desc") as "asc" | "desc",
        }
      : {}),
  };

  const { data: reportData, isLoading } = useAdminReport(activeFilters);

  const { columns: allColumns } = useColumns(colFilters, setColFilters, sortState);
  const columns = allColumns.filter((c) => visibleColumns.includes(String(c.key)));

  const statsData = reportData?.stats;

  const stats: StatItem[] = [
    { label: "Events", value: String(statsData?.count ?? reportData?.total ?? "—"), image: "/svgs/stat-icon.svg" },
    {
      label: "Remaining",
      value: statsData?.remaining != null ? `£${Number(statsData.remaining).toFixed(2)}` : "—",
      image: "/svgs/red-chart.svg",
    },
    {
      label: "Total paid",
      value: statsData?.totalPaid != null ? `£${Number(statsData.totalPaid).toFixed(2)}` : "—",
      image: "/svgs/red-chart.svg",
    },
    {
      label: "Total cost",
      value: statsData?.totalCost != null ? `£${Number(statsData.totalCost).toFixed(2)}` : "—",
      image: "/svgs/Line-chart.svg",
      variant: "green",
    },
  ];

  const resetFilters = () => {
    setFilters(initialParams);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSelectedEventStatus("");
    setColFilters({});
  };

  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search,
      event_start_time: dateFrom,
      event_end_time: dateTo,
      event_status: selectedEventStatus || undefined,
    }));
  };

  const [showStat, setShowStat] = useState({
    totalPaidStat: false,
    totalCostStat: false,
  });

  const toggleKeyMap: Record<string, keyof typeof showStat | undefined> = {
    "total paid": "totalPaidStat",
    "total cost": "totalCostStat",
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="">
            <BackButton />
          </Link>
          <div>
            {/* <p className="text-sm text-gray-500">Hello, Carlic!</p> */}
            <h2 className="themeH1">Admin Report</h2>
          </div>
        </div>
        <div className="flex gap-2">
          {/* <Button icon={<Export />}>Export Data</Button> */}
          {/* <Button>
            <MoreVertical size={18} />
          </Button> */}
        </div>
      </div>
          {/* Stat cards removed — Admin Report's stats need to be rebuilt to
              match the legacy Laravel report's actual computation (see the
              Suppliers Report page's payment_send-based parity work).
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item) => {
              const lookup = (item.label || "").toString().toLowerCase();
              const statKey = toggleKeyMap[lookup];
              const isToggleable = Boolean(statKey);
              const isVisible = statKey ? Boolean(showStat[statKey]) : true;
              const iconColor = item.variant === "green" ? "#fff" : undefined;

              return (
                <Card
                  key={item.label}
                  variant={item.variant || "white"}
                  className={`flex items-center justify-between`}
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
                    alt={item.imageAlt || item.label}
                    width={52}
                    height={39}
                  />
                </Card>
              );
            })}
          </div>
          */}
      <div className="rounded-2xl overflow-hidden [&_.ant-table]:rounded-none! [&_.ant-table-container]:rounded-none!">
        {/* flex-wrap instead of a fixed grid-cols-N: a rigid column count
            forces every cell — including the two-button group — into an
            equal fraction of the row regardless of whether its content
            actually fits, which is exactly what was overflowing past the
            container's right edge (buttons can't shrink below their own
            label + padding). Each control instead gets a min-width and
            wraps onto its own line once the row runs out of room, at any
            viewport size, rather than only at specific Tailwind breakpoints. */}
        <div className="bg-primary p-4 flex flex-wrap gap-2">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search event"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[180px] max-w-full">
            <Select
              allowClear
              placeholder="Confirmed and Completed Events"
              className="w-full h-10 bg-white rounded-lg text-xs"
              value={selectedEventStatus || undefined}
              onChange={(val) => setSelectedEventStatus(String(val || ""))}
              options={[
                { label: "Confirmed and Completed Events", value: "" },
                { label: "Open Enquiry Events", value: "open" },
                { label: "Confirmed Events", value: "confirmed" },
                { label: "Completed Events", value: "completed" },
                { label: "Cancelled Events", value: "cancelled" },
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
          {/* Third attempt at this one row, so the reasoning that DIDN'T hold
              is worth keeping:

              1. `shrink-0`, no wrap: forced full width regardless of room —
                 overflowed and clipped "Columns" on a phone.
              2. `flex-1 min-w-[400px]`: a `min-width` is a hard floor even
                 under `flex-wrap` — at 393px the row is only ~320px after
                 padding, narrower than the floor, so the GROUP overflowed
                 the same way, one level up.
              3. `flex-1`, no min-w: this looked right ("it's already one
                 flex item, so it already moves as a unit") but missed that
                 the group ALSO has its own `flex-wrap`. A flex item's
                 automatic minimum width defaults to its MIN-CONTENT size —
                 and because this container can wrap internally, its
                 min-content collapses to just its narrowest single
                 unwrappable piece (~150px, one button), not all three
                 buttons together. The outer row's wrap algorithm saw a
                 150px-minimum item, not a 406px one, and happily packed
                 "Apply Filters" onto the tail of the Date (To) row —
                 buttons interleaved with unrelated fields instead of
                 staying together.

              `w-full` (not `flex-1`) is what actually guarantees "own row,
              any width, no floor": a 100%-wide flex item cannot coexist with
              anything else on its line — there is no room left for a
              sibling once one item claims the whole row — so it forces a
              wrap boundary on both sides with no min-width, no floor, and
              no dependence on what the group's own narrowest child happens
              to be. `flex-wrap` still lets its 3 buttons break onto two
              internal lines if a screen is too narrow for all three, now
              without ever leaking into the row above or below it. */}
          <div className="w-full flex flex-wrap gap-2">
            <Button className="flex-1 h-10!" onClick={applyFilters}>Apply Filters</Button>
            <Button
              className="flex-1 h-10!"
              icon={<RefreshCw size={14} />}
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
            <Dropdown
              trigger={["click"]}
              popupRender={() => (
                <div className="bg-white rounded-lg shadow-lg p-3 min-w-[220px]">
                  {allColumns.map((c) => {
                    const key = String(c.key);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 py-1 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={visibleColumns.includes(key)}
                          onChange={(e) =>
                            setVisibleColumns((prev) =>
                              e.target.checked
                                ? [...prev, key]
                                : prev.filter((k) => k !== key),
                            )
                          }
                        />
                        {COLUMN_LABELS[key] ?? key}
                      </label>
                    );
                  })}
                </div>
              )}
            >
              <Button className="flex-1 h-10!" icon={<Columns3 size={14} />}>
                Columns
              </Button>
            </Dropdown>
          </div>
        </div>
        <DataTable
          wrapperClassName="overflow-hidden"
          columns={columns}
          dataSource={reportData?.result}
          pagination={{
            pageSize: filters.perPage,
            current: filters.page,
            total: reportData?.total,
            onChange: (page, pageSize) => {
              setFilters((prev) => ({ ...prev, page, perPage: pageSize }));
            },
          }}
          onChange={(_pagination, _tableFilters, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            const key = s?.columnKey != null ? String(s.columnKey) : null;
            // Sorting is server-side, so reset to page 1 — staying on page 5 of
            // the old ordering would show an unrelated slice of the new one.
            if (!s?.order || !key) {
              setSortState(null);
            } else {
              setSortState({ field: key, order: s.order });
            }
            setFilters((prev) => ({ ...prev, page: 1 }));
          }}
          loading={isLoading}
          rowKey={(data) => data.event_id}
        />
      </div>
    </div>
  );
};

export default Page;
