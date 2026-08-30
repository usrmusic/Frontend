import { TableColumnsType, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import { useUpdateSupplierPayment } from "@/src/api/reports";

interface SupplierReportRow {
  id: string;
  event_id: number;
  row_type: "equipment" | "dj";
  company_name: string | null;
  equipment_name: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  cost_price: number;
  quantity: number | null;
  payment_send: "yes" | "no" | null;
  payment_date: string | null;
}

// Numeric id the backend endpoints expect — event_package.id for an
// equipment row, the event id for a DJ row (matches Laravel's two separate
// save paths: createSupplierReport() vs createSupplierReportIndj()).
const rawId = (row: SupplierReportRow) =>
  row.row_type === "dj" ? row.event_id : Number(String(row.id).replace(/^ep-/, ""));

const useColumns = () => {
  const updatePayment = useUpdateSupplierPayment();

  const columns: TableColumnsType<SupplierReportRow> = [
    {
      key: "company_name",
      dataIndex: "company_name",
      title: (
        <div>
          <p className="mb-1">Supplier/DJ</p>
        </div>
      ),
    },
    {
      key: "eventDate",
      dataIndex: "date",
      title: (
        <div>
          <p className="mb-1">Event Date</p>
        </div>
      ),
      render: (date) => <>{date ? dayjs(date).format("DD/MM/YYYY") : ""}</>,
    },
    {
      key: "startTime",
      dataIndex: "start_time",
      title: (
        <div>
          <p className="mb-1">Start Time</p>
        </div>
      ),
      render: (date) => <>{dayjs(date).format("MM-DD-YYYY")}</>,
    },
    {
      key: "endTime",
      dataIndex: "end_time",
      title: (
        <div>
          <p className="mb-1">End Time</p>
        </div>
      ),
      render: (date) => <>{dayjs(date).format("MM-DD-YYYY")}</>,
    },
    {
      key: "venue",
      dataIndex: "venue",
      title: (
        <div>
          <p className="mb-1">Venue</p>
        </div>
      ),
    },
    {
      key: "requirement",
      dataIndex: "equipment_name",
      title: (
        <div>
          <p className="mb-1">Requirement</p>
        </div>
      ),
    },
    {
      key: "cost_price",
      dataIndex: "cost_price",
      title: (
        <div>
          <p className="mb-1">Costs</p>
        </div>
      ),
      render: (value) => <>{Number(value ?? 0).toFixed(2)}</>,
    },
    {
      key: "quantity",
      dataIndex: "quantity",
      title: (
        <div>
          <p className="mb-1">Quantity</p>
        </div>
      ),
      render: (value) => <>{value == null ? "NA" : value}</>,
    },
    {
      key: "payment_send",
      dataIndex: "payment_send",
      title: (
        <div>
          <p className="mb-1">Payment Send</p>
        </div>
      ),
      render: (value, row) => (
        <Select
          size="small"
          className="w-24"
          value={value ?? undefined}
          placeholder="—"
          allowClear
          loading={updatePayment.isPending}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          onChange={(val) =>
            updatePayment.mutate({
              rowType: row.row_type,
              id: rawId(row),
              payment_send: (val as "yes" | "no") ?? null,
              payment_date: row.payment_date,
            })
          }
        />
      ),
    },
    {
      key: "payment_date",
      dataIndex: "payment_date",
      title: (
        <div>
          <p className="mb-1">Payment Date</p>
        </div>
      ),
      render: (value, row) => (
        <DatePicker
          size="small"
          value={value ? dayjs(value) : null}
          onChange={(_, dateString) =>
            updatePayment.mutate({
              rowType: row.row_type,
              id: rawId(row),
              payment_send: row.payment_send,
              payment_date: Array.isArray(dateString) ? dateString[0] || null : dateString || null,
            })
          }
        />
      ),
    },
  ];

  return { columns };
};

export default useColumns;
