"use client";
import { useGetCompletedEventsList } from "@/src/api/events";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { TableColumnsType, TableProps, Select } from "antd";
import { useRouter } from "next/navigation";
import SendBrochureModal from "../open-enquiry/SendBrochure";
import { fetchEmailTemplate } from "@/src/api/enquiry";
import { useDownloadInvoice } from "@/src/api/events";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const CompletedEventsPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sendMode, setSendMode] = useState<"quote" | "invoice">("quote");
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState<null>(null);
  const [modalCompanies, setModalCompanies] = useState<Array<{
    id: string | number;
    name: string;
  }> | null>(null);
  const router = useRouter();
  const debouncedSearch = useDebounce(search, 1000);

  const searchParams = useSearchParams();
  useEffect(() => {
    const s = searchParams?.get("search") ?? "";
    const name = searchParams?.get("name") ?? "";
    const displayValue = name || s;
    if (displayValue && displayValue !== search) {
      setSearch(displayValue);
      setParams((prev) => ({ ...prev, page: 1 }));
    }
  }, [searchParams?.toString()]);

  const { data: completedEventsData, isLoading } = useGetCompletedEventsList({
    ...params,
    search: debouncedSearch,
    paymentStatus: paymentStatus || undefined,
  });
  const { mutate: downloadInvoiceMutation, isPending: isDownloadingInvoice } =
    useDownloadInvoice();
  const rowSelection: TableProps["rowSelection"] = {
    type: "radio",
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: any[]) => {
      setSelectedRowKeys(keys.slice(0, 1));
      setSelectedRows(rows.slice(0, 1));
    },
  };

  const selectedId =
    selectedRowKeys && selectedRowKeys.length
      ? String(selectedRowKeys[0])
      : null;

  const columns: TableColumnsType = [
    {
      key: "name",
      dataIndex: ["users_events_user_idTousers", "name"],
      title: "Name",
    },
    {
      key: "email",
      dataIndex: ["users_events_user_idTousers", "email"],
      title: "Email",
    },
    {
      key: "mobile",
      dataIndex: ["users_events_user_idTousers", "contact_number"],
      title: "Mobile",
    },
    {
      key: "venue",
      dataIndex: "venue",
      title: "Venue",
    },
    {
      key: "date",
      dataIndex: "date",
      title: "Event Date",
      render: (date) => <>{dayjs(date).format("DD-MM-YYYY")}</>,
    },
    {
      key: "payment",
      dataIndex: "is_event_payment_fully_paid",
      title: "Payment",
      render: (data) => (
        <div
          className={`${data && "bg-[#D4F4DD]"} ${!data && "bg-[#FFF4CC] text-[#9C6F19]"} w-[98px] rounded-full text-center text-[#0F7B3B] py-1 text-xs capitalize`}
        >
          {data ? "Completed" : "Pending"}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-4 mt-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="">
              <BackButton />
            </Link>
            <h2 className="themeH1">Completed Events</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() =>
                selectedId &&
                router.push(
                  `/confirmed-events?search=${selectedId}&from=completed`,
                )
              }
              disabled={!selectedId}
            >
              View
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedId) return;
                setButtonLoading("quote");
                try {
                  const data = await fetchEmailTemplate(
                    String(selectedId),
                    "SEND QUOTE-CONFIRMED",
                  );
                  setModalTemplate(data?.email ?? null);
                  setModalCompanies(data?.companies ?? null);
                  setSendMode("quote");
                  setShowModal(true);
                } catch (err) {
                  toast.error("Failed to load email template");
                } finally {
                  setButtonLoading(null);
                }
              }}
              loading={buttonLoading === "quote"}
              disabled={!selectedId}
            >
              Send Email
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedId) return;
                setButtonLoading("invoice");
                try {
                  const data = await fetchEmailTemplate(
                    String(selectedId),
                    "SEND INVOICE-OPEN",
                  );
                  setModalTemplate(data?.email ?? null);
                  setModalCompanies(data?.companies ?? null);
                  setSendMode("invoice");
                  setShowModal(true);
                } catch (err) {
                  toast.error("Failed to load invoice template");
                } finally {
                  setButtonLoading(null);
                }
              }}
              loading={buttonLoading === "invoice"}
              disabled={!selectedId}
            >
              Send Invoice
            </Button>
            <Button
              type="default"
              onClick={() =>
                selectedId &&
                downloadInvoiceMutation({ id: String(selectedId) })
              }
              loading={isDownloadingInvoice}
              disabled={!selectedId}
            >
              Download Invoice
            </Button>
            <button className=" size-9 flex items-center justify-center rounded-lg bg-white hover:bg-secondary-200 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* <select
            name="event"
            id="event"
            className="bg-white rounded-lg h-10 px-3 text-sm"
          >
            <option value="">Select Event</option>
            <option value="event one">event one</option>
          </select> */}
          <div className="flex max-w-full items-center gap-2 rounded-lg bg-white px-4 h-10">
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
              placeholder="Payment status"
              className="w-full bg-white rounded-lg"
              options={[
                { label: "All", value: "" },
                { label: "Completed", value: "completed" },
                { label: "Pending", value: "pending" },
              ]}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(String(input).toLowerCase())
              }
              value={paymentStatus || undefined}
              onChange={(val) => {
                setPaymentStatus(String(val || ""));
                setParams((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>
        </div>
        <DataTable
          rowSelection={rowSelection}
          columns={columns}
          rowKey={(data) => String((data as any).id)}
          loading={isLoading}
          dataSource={completedEventsData?.data}
          pagination={{
            pageSize: params.perPage,
            current: params.page,
            total: completedEventsData?.meta.total,
            onChange: (page, pageSize) =>
              setParams({ ...params, page, perPage: pageSize }),
          }}
          onRow={(record) => ({
            onClick: () => {
              try {
                const id = (record as any)?.id;
                if (id === undefined || id === null) return;
                setSelectedRowKeys([String(id)]);
                setSelectedRows([record as any]);
              } catch (err) {
                // ignore
              }
            },
          })}
        />
        {showModal && (
          <SendBrochureModal
            open={showModal}
            eventId={selectedId || ""}
            sendMode={sendMode}
            template={modalTemplate}
            companies={modalCompanies}
            onCancel={() => setShowModal(false)}
          />
        )}
      </div>
    </>
  );
};

export default CompletedEventsPage;
