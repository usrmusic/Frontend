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
      <div className="flex items-center justify-between">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((item, index) => {
          const statKey = item.toggleKey;
          const isToggleable = Boolean(statKey);
          const isVisible = statKey ? Boolean(showStat[statKey]) : true;
          const iconColor = item.variant === "green" ? "#fff" : undefined;

          return (
            <Card
              key={`${item.label}-${index}`}
              variant={item.variant}
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
        <div className="bg-primary p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-w-full">
            <Select
              allowClear
              placeholder="Confirmed and Completed Events"
              className="w-full bg-transparent rounded-lg text-xs"
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
            className="w-full !bg-white"
            value={dateFrom ? dayjs(dateFrom) : null}
            onChange={(_, dateString) =>
              setDateFrom(Array.isArray(dateString) ? dateString[0] || "" : dateString)
            }
          />
          <DatePicker
            placeholder="Date (To)"
            className="w-full !bg-white"
            value={dateTo ? dayjs(dateTo) : null}
            onChange={(_, dateString) =>
              setDateTo(Array.isArray(dateString) ? dateString[0] || "" : dateString)
            }
          />
          <div className="flex gap-2">
            <Button className="flex-1 h-full!" onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button
              className="flex-1 h-full!"
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
