"use client";
import { Input, Table, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

export interface UpcomingEventRow {
  id: number;
  date?: string | null;
  event_date?: string | null;
  eventDate?: string | null;
  venue?: string | null;
  venue_name?: string | null;
  dj_name?: string | null;
  dj?: { name?: string | null } | null;
}

interface EventOverviewProps {
  events?: UpcomingEventRow[];
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export default function EventOverview({
  events = [],
  isLoading = false,
  onSearch,
  searchValue = "",
}: EventOverviewProps) {
  const router = useRouter();

  const handleEventRowDoubleClick = (record: UpcomingEventRow) => {
    try {
      const venue = record?.venue_name || record?.venue || "";
      const djName = record?.dj_name || record?.dj?.name || "";
      const searchQuery = `${djName} ${venue}`.trim();
      router.push(
        `/open-enquiry?search=${encodeURIComponent(searchQuery)}`,
      );
    } catch (e) {
      console.error("Navigation error:", e);
    }
  };

  const upcomingColumns: ColumnsType<UpcomingEventRow> = [
    {
      title: "Date",
      key: "date",
      render: (_text: unknown, record: UpcomingEventRow) => {
        const d = record?.date || record?.event_date || record?.eventDate;
        return d ? new Date(d).toLocaleDateString("en-GB") : "";
      },
    },
    {
      title: "Venue",
      key: "venue",
      render: (_text: unknown, record: UpcomingEventRow) => 
        record?.venue_name || record?.venue || "",
    },
    {
      title: "DJ Name",
      key: "dj_name",
      render: (_text: unknown, record: UpcomingEventRow) => 
        record?.dj_name || record?.dj?.name || "",
    },
  ];

  return (
    <div
      className="col-span-12 xl:col-span-6 p-0 overflow-hidden rounded-3xl bg-white"
      style={{ boxShadow: "0px 1px 3px 0px #0000001A" }}
    >
      <div className="flex items-center justify-between p-4 text-white rounded-t-3xl">
        <div className="flex items-center gap-3">
          <h4 className="font-poppins font-medium text-black">
            Event Overview
          </h4>
        </div>
        <div className="w-72">
          <Input
            placeholder="Search upcoming events"
            allowClear
            onChange={(e) => onSearch?.(e.target.value)}
            value={searchValue}
            size="middle"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-2xl border border-gray-50 p-3">
          <div className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-12">
              {isLoading ? (
                <div className="h-44 flex items-center justify-center">
                  <Spin size="large" />
                </div>
              ) : (
                <div className="max-h-[260px] overflow-auto no-scrollbar">
                  <Table<UpcomingEventRow>
                    size="small"
                    pagination={false}
                    dataSource={events}
                    rowKey={(r) => r.id}
                    columns={upcomingColumns}
                    onRow={(record) => ({
                      onDoubleClick: () => handleEventRowDoubleClick(record),
                      style: { cursor: "pointer" },
                    })}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
