import { TableColumnsType, Select } from "antd";
import dayjs from "dayjs";

// Plain-text label per column, for the toggle dropdown — column `title` is
// JSX (label + inline filter input), not usable as a checklist label.
export const COLUMN_LABELS: Record<string, string> = {
  company_name: "Company",
  client_name: "Client",
  event_date: "Event Date",
  event_status: "Event Status",
  dj: "DJ",
  venue_name: "Venue",
  total_price: "Total Price",
  total_cost: "Cost",
  extra_cost: "Extra Cost",
  profit: "Profit",
  payment_received: "Payment Received",
  payment_remaining: "Payment Outstanding",
};

// Kept lean on first load — the detailed cost breakdown columns are opt-in
// via the toggle dropdown rather than shown by default.
export const DEFAULT_VISIBLE_COLUMNS = [
  "company_name",
  "client_name",
  "event_date",
  "event_status",
  "dj",
  "venue_name",
  "total_price",
  "profit",
];

const useColumns = (
  colFilters: Record<string, string>,
  setColFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>,
) => {
  const setFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Helper — returns plain JSX (not a component) so React reconciles <input> in-place
  const textInput = (field: string, placeholder = "Filter…") => (
    <input
      type="text"
      placeholder={placeholder}
      value={colFilters[field] ?? ""}
      onChange={(e) => setFilter(field, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-normal bg-white! outline-none focus:border-primary placeholder:text-gray-400"
    />
  );

  const columns: TableColumnsType = [
    {
      key: "company_name",
      dataIndex: "company_name",
      width: 130,
      title: (
        <div>
          <p>Company</p>
          {textInput("company_name")}
        </div>
      ),
    },
    {
      key: "client_name",
      dataIndex: "client_name",
      width: 130,
      title: (
        <div>
          <p>Client</p>
          {textInput("search", "Search client…")}
        </div>
      ),
    },
    {
      key: "event_date",
      dataIndex: "event_date",
      width: 100,
      title: (
        <div>
          <p>Event Date</p>
          {textInput("event_date", "DD/MM/YYYY")}
        </div>
      ),
      render: (date) => <>{date ? dayjs(date).format("DD/MM/YYYY") : "—"}</>,
    },
    {
      key: "event_status",
      dataIndex: "event_status",
      width: 130,
      title: (
        <div>
          <p>Event Status</p>
          <Select
            size="small"
            value={colFilters["event_status"] || undefined}
            onChange={(val) => setFilter("event_status", val ?? "")}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            placeholder="All"
            allowClear
            className="mt-1 w-full"
            options={[
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
            ]}
          />
        </div>
      ),
      render: (value: string) => {
        const map: Record<string, string> = {
          COMPLETED: "bg-green-100 text-green-700",
          CANCELLED: "bg-yellow-100 text-yellow-800",
          CONFIRMED: "bg-teal-100 text-teal-800",
        };
        const classes = map[value] || "bg-gray-100 text-gray-700";
        return (
          <span className={`${classes} px-3 py-1 rounded-full text-xs font-semibold inline-block`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "dj",
      dataIndex: "dj_name",
      width: 90,
      title: (
        <div>
          <p>DJ</p>
          {textInput("dj_name")}
        </div>
      ),
    },
    {
      key: "venue_name",
      dataIndex: "venue_name",
      width: 110,
      title: (
        <div>
          <p>Venue</p>
          {textInput("venue_name")}
        </div>
      ),
    },
    {
      key: "total_price",
      dataIndex: "total_price",
      width: 95,
      title: (
        <div>
          <p>Total Price</p>
          {textInput("total_price", "£ amount")}
        </div>
      ),
      render: (v: number) => `£${Number(v || 0).toFixed(2)}`,
    },
    {
      key: "total_cost",
      dataIndex: "total_cost",
      width: 85,
      title: (
        <div>
          <p>Cost</p>
          {textInput("cost", "£ amount")}
        </div>
      ),
      render: (v: number) => `£${Number(v || 0).toFixed(2)}`,
    },
    {
      key: "extra_cost",
      dataIndex: "extra_cost",
      width: 85,
      title: (
        <div>
          <p>Extra Cost</p>
          {textInput("extra_cost", "£ amount")}
        </div>
      ),
      render: (v: number) => `£${Number(v || 0).toFixed(2)}`,
    },
    {
      key: "profit",
      dataIndex: "profit",
      width: 85,
      title: (
        <div>
          <p>Profit</p>
          {textInput("profit", "£ amount")}
        </div>
      ),
      render: (v: number) => `£${Number(v || 0).toFixed(2)}`,
    },
    {
      key: "payment_received",
      dataIndex: "payment_received",
      width: 95,
      title: (
        <div>
          <p>Payment Received</p>
          <input
            type="text"
            disabled
            placeholder="—"
            className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-normal bg-white! outline-none opacity-40 cursor-not-allowed"
          />
        </div>
      ),
      render: (v: number) => `£${Number(v || 0).toFixed(2)}`,
    },
    {
      key: "payment_remaining",
      dataIndex: "payment_remaining",
      width: 105,
      title: (
        <div>
          <p>Payment Outstanding</p>
          <input
            type="text"
            disabled
            placeholder="—"
            className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-normal bg-white! outline-none opacity-40 cursor-not-allowed"
          />
        </div>
      ),
      render: (v: number) => `£${Number(v || 0).toFixed(2)}`,
    },
  ];

  return { columns };
};

export default useColumns;
