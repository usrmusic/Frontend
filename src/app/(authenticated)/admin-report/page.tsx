"use client";
import React, { useState } from "react";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, Export, MagnifyingGlass } from "@/src/components/Icons";
import { DatePicker } from "antd";
import { MoreVertical, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useColumns from "./useColumns";

interface StatItem {
  label: string;
  value: string;
  image: string;
  imageAlt?: string;
  variant?: "white" | "green";
}

const stats: StatItem[] = [
  { label: "Events", value: "2230", image: "/svgs/stat-icon.svg" },
  { label: "Remaining", value: "321", image: "/svgs/red-chart.svg" },
  { label: "Total paid", value: "33550", image: "/svgs/red-chart.svg" },
  { label: "Total cost", value: "$540.50", image: "/svgs/Line-chart.svg", variant: "green" },
];

type Filters = {
  company?: string;
  client?: string;
  eventDate?: string;
  eventStatus?: string;
  dj?: string;
  venue?: string;
};

const Page = () => {
  const [filters, setFilters] = useState<Filters>({});
  const { columns, data } = useColumns(filters, setFilters as any);

  // NOTE: dropdowns are present in each header and controlled via `filters` state,
  // but for now we do NOT filter the table. Keep the selects UI-only.

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="">
            <BackButton />
          </Link>
          <div>
            <p className="text-sm text-gray-500">Hello, Carlic!</p>
            <h2 className="themeH1">Admin Report</h2>
          </div>
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
            variant={item.variant || "white"}
            className={`flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div>
                <p className={`text-sm ${item.variant === "green" ? "text-white" : "text-primary"}`}>
                  {item.label}
                </p>
                <p className={`text-xl font-semibold ${item.variant === "green" ? "text-white" : "text-black"}`}>
                  {item.value}
                </p>
              </div>
            </div>

            <Image src={item.image} alt={item.imageAlt || item.label} width={52} height={39} />
          </Card>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-primary p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search event"
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
            <Button className="flex-1 h-full!" icon={<RefreshCw size={14} />} onClick={() => setFilters({})}>
              Reset Filters
            </Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          rowKey={(data) => data.key}
          dataSource={data}
          pagination={false}
        />
      </div>
    </div>
  );
};

export default Page;
