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
  event_status_id?: number | null;
  couple_name?: string | null;
  client?: { id?: number; name?: string | null } | null;
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

  const handleEventRowClick = (record: UpcomingEventRow) => {
    try {
      // Prefer venue, then DJ, then couple/client name. Include `name` param for better search.
      const venue = record?.venue_name || record?.venue || "";
      const djName = record?.dj_name || record?.dj?.name || "";
      // couple_name may be present on event rows; include as label
      const coupleName = (record as any).couple_name || "";
      const clientName = (record as any).client?.name || "";
      // Prefer using the numeric event id when available — the confirmed-events
      // page expects `search` to be an id string. Fall back to text search when
      // id is not present.
      const idValue = typeof record.id === 'number' ? String(record.id) : (record.id ? String(record.id) : null);
      const searchTerm = idValue || venue || djName || coupleName || clientName || "";
      const label = coupleName || clientName || djName || venue || "";
      if (!searchTerm) return;
      // route based on status text if available, otherwise numeric fallback
      const statusText = String((record as any).event_status || "").toLowerCase();
      let target = '/open-enquiry';
      if (statusText.includes('enquir') || statusText.includes('open')) target = '/open-enquiry';
      else if (statusText.includes('confirm')) target = '/confirmed-events';
      else if (statusText.includes('complete')) target = '/completed-events';
      else {
        const statusNum = Number((record as any).event_status_id || 0);
        if (statusNum === 2) target = '/confirmed-events';
        else if (statusNum === 3 || statusNum === 4) target = '/completed-events';
      }
      router.push(`${target}?search=${encodeURIComponent(searchTerm)}&name=${encodeURIComponent(label)}`);
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
      <div className="flex items-center justify-between p-5 text-white rounded-t-3xl">
        <div className="flex items-center gap-3">
          <h4 className="font-poppins text-base font-semibold text-gray-900">
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

      <div className="px-5 pb-5">
        <div className="overflow-hidden rounded-2xl border border-gray-50 [&_.ant-table]:text-sm [&_.ant-table-thead_th]:text-sm [&_.ant-table-tbody_td]:text-sm">
          {isLoading ? (
            <div className="h-44 flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <div className="max-h-[300px] overflow-auto no-scrollbar">
              <Table<UpcomingEventRow>
                size="small"
                pagination={false}
                dataSource={events}
                rowKey={(r) => r.id}
                columns={upcomingColumns}
                onRow={(record) => ({
                  onClick: () => handleEventRowClick(record),
                  style: { cursor: "pointer" },
                })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
