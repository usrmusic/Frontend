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
          {/* `shrink-0` with no wrap of its own meant this 3-button group
              (Apply Filters, Reset Filters, Columns — ~406px combined) had to
              render at full width no matter how little room was left once
              the outer `flex-wrap` pushed it onto its own line. On a phone
              that's narrower than the group itself, so it overflowed the
              card and the ancestor's `overflow-hidden` sliced "Columns" down
              to "Col…" instead of showing it. `flex-wrap` (no `shrink-0`)
              lets it break onto a second internal row instead of overflowing
              when it doesn't fit.

              `flex-1` (added to match Suppliers Report's identical filter
              bar): every sibling in this row — Search, Select, both
              DatePickers — is `flex-1` and stretches to divide up the full
              row width between them. This group was the one exception, sized
              only to its own content, so on a row by itself it sat flush
              left at its natural ~406px with a slab of plain green space
              filling the rest of the line — the same "not properly designed"
              gap Suppliers Report had, just not yet fixed here. `min-w`
              keeps the three buttons from being squeezed uncomfortably
              narrow before `flex-wrap` (above) lets them break onto a second
              internal line if the row is ever narrower than that. */}
          {/* The 3 buttons ALSO need `flex-1` individually, not just their
              wrapper — the wrapper has no background of its own (it's a bare
              layout div sitting on the green card), so stretching only IT
              left the extra space invisible: same green as the page behind
              it, indistinguishable from not stretching at all. Suppliers
              Report's Apply/Reset pair already had `flex-1` on each button
              from earlier work, which is why that fix was visible there and
              this one wasn't. */}
          <div className="flex-1 flex flex-wrap gap-2 min-w-[400px]">
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
