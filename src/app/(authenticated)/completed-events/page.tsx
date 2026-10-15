"use client";
import { useGetCompletedEventsList } from "@/src/api/events";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import MobileMenuButton from "@/src/components/common/MobileMenuButton";
import BackLink from "@/src/components/common/BackLink";
import { useDebounce } from "@/src/hooks/useDebounce";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { TableColumnsType, TableProps, Select } from "antd";
import { useRouter } from "next/navigation";
import SendBrochureModal from "../open-enquiry/SendBrochure";
import { fetchEmailTemplate } from "@/src/api/enquiry";
import { useDownloadInvoice, useSendThankYouEmail } from "@/src/api/events";
import { ThankYouModal } from "./_components/ThankYouModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { CSVLink } from "react-csv";
import useRole from "@/src/hooks/useRole";
import AccessDenied from "@/src/components/common/AccessDenied";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const PAYMENT_STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

const CompletedEventsPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sendMode, setSendMode] = useState<"quote" | "invoice">("quote");
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState<null>(null);
  const [modalCompanies, setModalCompanies] = useState<Array<{
    id: string | number;
    name: string;
  }> | null>(null);
  const router = useRouter();
  const { isClient } = useRole();
  const debouncedSearch = useDebounce(search, 1000);

  const searchParams = useSearchParams();
  const searchParamsKey = searchParams?.toString() ?? "";
  // Fire once per incoming URL, not on every keystroke — `search` was in
  // the dep list before, so as soon as the user edited the seeded search
  // box, this effect re-ran, saw the URL's value still didn't match what
  // they'd just typed, and snapped it straight back (the URL param is never
  // cleared), making the box uneditable after a dashboard/calendar redirect.
  const searchSyncedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (searchSyncedForRef.current === searchParamsKey) return;
    searchSyncedForRef.current = searchParamsKey;
    const s = searchParams?.get("search") ?? "";
    const name = searchParams?.get("name") ?? "";
    const displayValue = name || s;
    if (displayValue) {
      setSearch(displayValue);
      setParams((prev) => ({ ...prev, page: 1 }));
    }
  }, [searchParams, searchParamsKey]);

  const { data: completedEventsData, isLoading } = useGetCompletedEventsList({
    ...params,
    search: debouncedSearch,
    paymentStatus: paymentStatus || undefined,
  });
  const { mutate: downloadInvoiceMutation, isPending: isDownloadingInvoice } =
    useDownloadInvoice();
  const { mutate: sendThankYouMutation, isPending: isSendingThankYou } =
    useSendThankYouEmail();
  const rowSelection: TableProps["rowSelection"] = {
    type: "radio",
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys.slice(0, 1));
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
      dataIndex: ["venues", "venue"],
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

  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Mobile", key: "mobile" },
    { label: "Venue", key: "venue" },
    { label: "Event Date", key: "date" },
    { label: "Payment", key: "payment" },
  ];

  const csvData = completedEventsData?.data.map((row) => ({
    name: row.users_events_user_idTousers.name,
    email: row.users_events_user_idTousers.email,
    mobile: row.users_events_user_idTousers.contact_number,
    venue: row.venues.venue,
    date: row.date,
    payment: row.is_event_payment_fully_paid ? "Completed" : "Pending",
  }));

  if (isClient) {
    return (
      <AccessDenied message="Completed events aren't available for client accounts." />
    );
  }

  return (
    <>
      {/* Phone: the header wrapper flattens (`max-sm:contents`) so the
          order can follow the mobile design — title, search, buttons, table.
          The payment filter and Export are desktop-only. */}
      <div className="space-y-4 mt-4 max-sm:space-y-0 max-sm:flex max-sm:flex-col max-sm:gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center max-sm:contents">
          <div className="flex items-center gap-3 max-sm:order-1">
            <MobileMenuButton />
            <BackLink />
            <h2 className="themeH1">Completed Events</h2>
          </div>
          {/* Same 3+1 orphan bug as Open Enquiry/Users/Clients/Confirmed
              Events: 4 buttons under plain `flex-wrap` packed 3 onto row one
              and stranded "Download Invoice" alone on row two. 2-column grid
              below `sm` gives every button an even half-width cell instead. */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center max-sm:order-3">
            <Button
              onClick={() => {
                if (!selectedId) {
                  toast.error("Please select an event first");
                  return;
                }
                router.push(
                  `/confirmed-events?search=${selectedId}&from=completed`,
                );
              }}
            >
              View
            </Button>
            <Button
              type="primary"
              onClick={() => {
                if (!selectedId) {
                  toast.error("Please select an event first");
                  return;
                }
                setShowThankYouModal(true);
              }}
            >
              Send Email
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedId) {
                  toast.error("Please select an event first");
                  return;
                }
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
                  toast.error(
                    (err as string) ?? "Failed to load invoice template",
                  );
                } finally {
                  setButtonLoading(null);
                }
              }}
              loading={buttonLoading === "invoice"}
            >
              Send Invoice
            </Button>
            <Button
              type="default"
              onClick={() => {
                if (!selectedId) {
                  toast.error("Please select an event first");
                  return;
                }
                downloadInvoiceMutation({ id: String(selectedId) });
              }}
              loading={isDownloadingInvoice}
            >
              Download Invoice
            </Button>
            {/* <button className=" size-9 flex items-center justify-center rounded-lg bg-white hover:bg-secondary-200 transition-colors">
              <MoreVertical size={18} />
            </button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 max-sm:order-2">
          {/* Phone: rounded pill with the black round search button, as in
              the mobile design. Searching is still live as you type; the
              button just focuses the box. */}
          <div className="flex max-w-full items-center gap-2 rounded-lg bg-white px-4 h-10 max-sm:rounded-full max-sm:h-12 max-sm:pr-1.5">
            <span className="max-sm:hidden">
              <MagnifyingGlass w={18} h={18} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500 max-sm:placeholder:text-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              aria-label="Search"
              onClick={() => searchInputRef.current?.focus()}
              className="sm:hidden shrink-0 bg-black size-9 flex items-center justify-center text-white rounded-full"
            >
              <MagnifyingGlass />
            </button>
          </div>
          <div className="max-w-full hidden sm:block">
            <Select
              allowClear
              placeholder="Payment status"
              className="w-full bg-white rounded-lg"
              options={PAYMENT_STATUS_OPTIONS}
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
          <div className="sm:col-span-2 hidden sm:flex flex-wrap gap-2 sm:justify-end">
            <CSVLink
              data={csvData ?? []}
              filename="clients.csv"
              headers={csvHeaders}
            >
              <Button>Export Data</Button>
            </CSVLink>
          </div>
        </div>
        <DataTable
          wrapperClassName="overflow-hidden rounded-xl max-sm:order-4"
          rowSelection={rowSelection}
          columns={columns}
          rowKey={(data) => String((data).id)}
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
                const id = (record as { id: string | number })?.id;
                if (id === undefined || id === null) return;
                setSelectedRowKeys([String(id)]);
              } catch (err) {
                toast.error((err as string) ?? "Failed to load email template");
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
        {showThankYouModal && (
          <ThankYouModal
            open={showThankYouModal}
            onCancel={() => setShowThankYouModal(false)}
            onSend={(subject, body) => {
              if (!selectedId) return;
              sendThankYouMutation(
                { id: selectedId, payload: { subject, body } },
                {
                  onSuccess: () => {
                    setShowThankYouModal(false);
                  },
                },
              );
            }}
            isSending={isSendingThankYou}
          />
        )}
      </div>
    </>
  );
};

export default CompletedEventsPage;
