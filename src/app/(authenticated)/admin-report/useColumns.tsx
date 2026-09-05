import { TableColumnsType, Select, InputNumber } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "react-toastify";
import { useUpdateAdminReportRow } from "@/src/api/reports";

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
interface AdminReportRow {
  event_id: number;
  event_status_id: number | null;
  total_price: number;
  total_cost: number;
  extra_cost: number;
  [key: string]: unknown;
}

export const DEFAULT_VISIBLE_COLUMNS = [
  "company_name",
  "client_name",
  "event_date",
  "dj",
  "venue_name",
  "total_price",
  "extra_cost",
];

const useColumns = (
  colFilters: Record<string, string>,
  setColFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>,
) => {
  const setFilter = (key: string, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
  };

  const updateRow = useUpdateAdminReportRow();
  // Tracks the in-progress value per row while typing, so we don't fire a
  // save on every keystroke — only commits on blur, matching Laravel's
  // explicit Save-button step (just without a separate edit-mode toggle).
  const [draftExtraCost, setDraftExtraCost] = useState<Record<number, number>>({});

  // Helper — returns plain JSX (not a component) so React reconciles <input> in-place
  const textInput = (field: string, placeholder = "Filter…") => (
    <input
      type="text"
      placeholder={placeholder}
      value={colFilters[field] ?? ""}
      onChange={(e) => setFilter(field, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="mt-1.5 block w-full border border-primary/20 rounded-lg px-3 py-1.5 text-xs font-normal bg-white! outline-none focus:border-primary placeholder:text-gray-400"
    />
  );

  const columns: TableColumnsType<AdminReportRow> = [
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
      width: 110,
      title: (
        <div>
          <p>Extra Cost</p>
          {textInput("extra_cost", "£ amount")}
        </div>
      ),
      render: (v: number, row: AdminReportRow) => {
        // Cancelled events are never editable — matches Laravel's dbl-click
        // block there (a toast warning instead of opening edit mode).
        // A missing/invalid event_id would otherwise make every row share
        // the same draft-state key (all rows editing as one) — refuse to
        // edit rather than risk that, and read-only display instead.
        if (Number(row.event_status_id) === 4) {
          return (
            <span
              className="cursor-not-allowed"
              onClick={() => toast.warning("This event has been cancelled")}
            >
              £{Number(v || 0).toFixed(2)}
            </span>
          );
        }
        if (!Number.isFinite(row.event_id)) {
          return `£${Number(v || 0).toFixed(2)}`;
        }
        const draft = draftExtraCost[row.event_id];
        return (
          <InputNumber
            size="small"
            prefix="£"
            className="w-full"
            value={draft ?? v ?? 0}
            disabled={updateRow.isPending}
            onChange={(val) =>
              setDraftExtraCost((prev) => ({ ...prev, [row.event_id]: Number(val ?? 0) }))
            }
            onBlur={() => {
              const next = draftExtraCost[row.event_id];
              if (next == null || next === Number(v || 0)) return;
              updateRow.mutate({
                event_id: row.event_id,
                extra_cost: next,
                cost: Number(row.total_cost || 0),
                totalCost: Number(row.total_price || 0),
              });
              toast.success("Extra cost updated");
            }}
          />
        );
      },
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
            className="mt-1.5 block w-full border border-primary/20 rounded-lg px-3 py-1.5 text-xs font-normal bg-white! outline-none opacity-40 cursor-not-allowed"
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
            className="mt-1.5 block w-full border border-primary/20 rounded-lg px-3 py-1.5 text-xs font-normal bg-white! outline-none opacity-40 cursor-not-allowed"
          />
        </div>
      ),
      render: (v: number) => `£${Number(v || 0).toFixed(2)}`,
    },
  ];

  return { columns };
};

export default useColumns;
