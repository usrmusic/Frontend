"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, Export, MagnifyingGlass } from "@/src/components/Icons";
import { DatePicker } from "antd";
import { MoreVertical, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useColumns from "./useColumns";
import { useSuppliersReport } from "@/src/api/reports";
import SkeletonInput from "antd/es/skeleton/Input";
import { useState } from "react";

interface StatItem {
  label: string;
  value: string;
  image: string;
  imageAlt: string;
  variant: "white" | "green";
  icon?: string;
}

const initialParams = {
  page: 1,
  perPage: 10,
};

const SuppliersPage = () => {
  const [params, setParams] = useState(initialParams);
  const { data: suppliersReportData, isLoading } = useSuppliersReport(params);

  const { columns } = useColumns();

  const statsData = suppliersReportData?.stats;
  const stats: StatItem[] = [
    {
      label: "Events",
      value: "2230",
      image: "/svgs/stat-icon.svg",
      imageAlt: "stat",
      variant: "white",
    },
    {
      label: "Remaining",
      value: statsData?.remaining,
      image: "/svgs/red-chart.svg",
      imageAlt: "stat",
      variant: "white",
      icon: "/svgs/list-icon.svg",
    },
    {
      label: "Total Paid",
      value: statsData?.totalPaid,
      image: "/svgs/red-chart.svg",
      imageAlt: "stat",
      variant: "white",
    },
    {
      label: "Total Cost",
      value: statsData?.totalCost,
      image: "/svgs/Line-chart.svg",
      imageAlt: "stat",
      variant: "green",
    },
  ];
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
          <Button icon={<Export />}>Export Data</Button>
          <Button>
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <Card
            key={item.label}
            variant={item.variant}
            className={`flex items-center justify-between`}
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
                  <p
                    className={`text-xl font-semibold ${item.variant === "green" ? "text-white" : "text-black"}`}
                  >
                    {item.value}
                  </p>
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
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-primary p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
            />
          </div>
          <select
            name="confirmedEvent"
            className="bg-white rounded-lg text-xs px-3"
          >
            <option value="">Confirmed and Completed Events</option>
          </select>
          <DatePicker
            placeholder="Date (From)"
            className="[&_input]:bg-white!"
          />
          <DatePicker placeholder="Date (To)" className="[&_input]:bg-white!" />
          <div className="flex gap-2">
            <Button className="flex-1 h-full!">Apply Filters</Button>
            <Button className="flex-1 h-full!" icon={<RefreshCw size={14} />}>
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
