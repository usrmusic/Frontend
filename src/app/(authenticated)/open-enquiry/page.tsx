"use client";
import {
  useAddNote,
  useOpenEnquiryList,
  useDeleteEnquiry,
} from "@/src/api/enquiry";
import { useConfirmEvent } from "@/src/api/events";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { MoreVertical, X } from "lucide-react";
import { useFormik } from "formik";
import { Select, DatePicker, TableColumnsType, InputNumber } from "antd";
import type { TableRowSelection } from "antd/es/table/interface";
import dayjs from "dayjs";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "antd";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/src/hooks/useDebounce";
import SendBrochureModal from "./SendBrochure";
import { toast } from "react-toastify";
import { fetchEmailTemplate } from "@/src/api/enquiry";
import { useCompanyDropdown } from "@/src/api/dropdown";
// using Ant Design inputs for date/amount

const initialParams = {
  page: 1,
  limit: 10,
  search: "",
};

import type { OpenEnquiryList } from "@/src/api/enquiry";

interface CompanyOption {
  id: number | string;
  name: string;
}

const OpenEnquiryPage = () => {
  const [params, setParams] = useState(initialParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState<unknown | null>(null);
  const [modalCompanies, setModalCompanies] = useState<Array<{
    id: string | number;
    name: string;
  }> | null>(null);
  const [note, setNote] = useState("");
  const [searchInput, setSearchInput] = useState(initialParams.search);
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRowData, setSelectedRowData] = useState<
    OpenEnquiryList[] | null
  >(null);
  const [clickedBtn, setClickedBtn] = useState<
    "brochure" | "quote" | "invoice"
  >("invoice");

  const { data: enquiryData, isLoading } = useOpenEnquiryList(params);
  const { data: companyNameOptions } = useCompanyDropdown();

  const { mutate: addNoteMutation, isPending: addingNote } = useAddNote();
  const { mutate: confirmEventMutation, isPending: confirmingEvent } =
    useConfirmEvent();
  const deleteEnquiry = useDeleteEnquiry();
  const router = useRouter();

  // Memoize options to prevent unnecessary re-renders and fix TS mapping
  const companyOptions = useMemo(() => {
    const dynamicOptions =
      companyNameOptions?.data?.map((opt: CompanyOption) => ({
        label: opt.name,
        value: String(opt.id),
      })) || [];

    return [{ label: "Select company", value: "" }, ...dynamicOptions];
  }, [companyNameOptions]);

  const formik = useFormik({
    initialValues: {
      company_name: "",
      event_date: "",
      deposit_amount: "",
      payment_method_id: "",
    },
    onSubmit: (values, { resetForm }) => {
      if (!selectedRowKeys.length) {
        toast.error("Please select an enquiry first");
        return;
      }

      // ensure event_date is a valid DD-MM-YYYY string (avoid 'Invalid Date')
      const formattedEventDate = values.event_date
        ? dayjs(values.event_date, "DD-MM-YYYY").format("DD-MM-YYYY")
        : "";

      confirmEventMutation(
        {
          id: String(selectedRowKeys[0]),
          payload: {
            company_name: String(values.company_name),
            event_date: formattedEventDate,
            deposit_amount: Number(values.deposit_amount),
            payment_method_id: Number(values.payment_method_id),
          },
        },
        {
          onSuccess: () => {
            toast.success("Deposit added successfully");
            resetForm();
          },
        },
      );
    },
  });

  const onSelectChange = (
    newSelectedRowKeys: React.Key[],
    rows: OpenEnquiryList[],
  ) => {
    // checkbox UI, but enforce single-select: keep only the last toggled row
    const lastKey = newSelectedRowKeys[newSelectedRowKeys.length - 1];
    if (lastKey === undefined) {
      setSelectedRowKeys([]);
      setSelectedRowData(null);
      return;
    }
    const lastRow = rows.find((r) => String(r.id) === String(lastKey)) ?? null;
    setSelectedRowKeys([String(lastKey)]);
    setSelectedRowData(lastRow ? [lastRow] : null);
  };

  const rowSelection: TableRowSelection<OpenEnquiryList> = {
    type: "checkbox",
    hideSelectAll: true,
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns: TableColumnsType<OpenEnquiryList> = [
    {
      title: "Name",
      dataIndex: ["users_events_user_idTousers", "name"],
      key: "name",
      width: 160,
      sorter: (a, b) => {
        const an =
          (a.users_events_user_idTousers as { name?: string })?.name ?? "";
        const bn =
          (b.users_events_user_idTousers as { name?: string })?.name ?? "";
        return an.localeCompare(bn);
      },
    },
    {
      title: "Mobile",
      dataIndex: ["users_events_user_idTousers", "contact_number"],
      key: "mobile",
      width: 130,
    },
    {
      title: "Event Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      sorter: (a, b) =>
        dayjs(a.date as string).valueOf() - dayjs(b.date as string).valueOf(),
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Tell Us More",
      dataIndex: "details",
      key: "details",
      ellipsis: true,
      sorter: (a, b) =>
        String(a.details ?? "").localeCompare(String(b.details ?? "")),
    },
  ];

  const hanldeAddNote = () => {
    if (!note.trim()) return;
    addNoteMutation(
      { id: Number(selectedRowKeys[0]), note },
      {
        onSuccess: () => {
          toast.success("Note Added Successfully");
          setNote("");
        },
      },
    );
  };

  // Keep selectedRowData in sync after data changes (so Recent Activities updates)
  useEffect(() => {
    if (!selectedRowKeys?.length) return;
    const id = String(selectedRowKeys[0]);
    const found = enquiryData?.data?.find((d) => String(d.id) === id) || null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (found) setSelectedRowData([found]);
  }, [enquiryData, selectedRowKeys]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const s = searchParams?.get("search") ?? "";
    const name = searchParams?.get("name") ?? "";
    if (!s) return;
    const displayValue = name || s;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(displayValue);
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams((prev) => {
      if (prev.search === debouncedSearch) return prev;
      return { ...prev, search: debouncedSearch, page: 1 };
    });
  }, [debouncedSearch]);

  return (
    <div className="mt-8 space-y-5">

      {/* Page header */}
      <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="shrink-0">
            <BackButton />
          </Link>
          <h2 className="themeH1">Open Enquiry</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="default"
            className="themeDefaultButton"
            disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
            onClick={() => {
              if (!selectedRowKeys.length) return;
              router.push(`/enquiry?select=${encodeURIComponent(String(selectedRowKeys[0]))}`);
            }}
          >
            Edit
          </Button>
          <Button
            type="default"
            danger
            className="themeDefaultButton"
            disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
            loading={buttonLoading === "delete"}
            onClick={() => {
              if (!selectedRowKeys.length) return;
              Modal.confirm({
                title: (
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 text-xl">⚠️</span>
                    <span className="font-medium">Delete enquiry</span>
                  </div>
                ),
                content: (
                  <div className="text-sm text-gray-700">
                    Are you sure you want to delete this enquiry? This action cannot be undone. This will permanently remove the enquiry and related temporary data.
                  </div>
                ),
                centered: true,
                maskClosable: false,
                okText: "Delete",
                okButtonProps: { danger: true, className: "!bg-red-600 !border-red-600 hover:!bg-red-700" },
                cancelText: "Cancel",
                onOk: () => {
                  const id = String(selectedRowKeys[0]);
                  setButtonLoading("delete");
                  deleteEnquiry.mutate(id, {
                    onSuccess: () => {
                      toast.success("Enquiry deleted");
                      setSelectedRowKeys([]);
                      setSelectedRowData(null);
                      setButtonLoading(null);
                    },
                    onError: () => {
                      setButtonLoading(null);
                    },
                  });
                },
              });
            }}
          >
            Delete
          </Button>
          <Button
            type="default"
            disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
            className="themeDefaultButton"
            loading={buttonLoading === "emailUpdate"}
            onClick={async () => {
              if (!selectedRowKeys.length) return;
              setButtonLoading("emailUpdate");
              try {
                const data = await fetchEmailTemplate(String(selectedRowKeys[0]), "EMAIL FOR UPDATE");
                setModalTemplate(data?.email ?? null);
                setModalCompanies(data?.companies ?? null);
                setClickedBtn("brochure");
                setModalOpen(true);
              } catch (err) {
                console.error(err);
                toast.error("Failed to load email template");
              } finally {
                setButtonLoading(null);
              }
            }}
          >
            Email Update
          </Button>
          <Button
            type="default"
            className="themeDefaultButton"
            loading={buttonLoading === "brochure"}
            disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
            onClick={async () => {
              if (!selectedRowKeys.length) return;
              setButtonLoading("brochure");
              try {
                const data = await fetchEmailTemplate(String(selectedRowKeys[0]), "EMAIL BROCHURE");
                setModalTemplate(data?.email ?? null);
                setModalCompanies(data?.companies ?? null);
                setClickedBtn("brochure");
                setModalOpen(true);
              } catch (err) {
                console.error(err);
                toast.error("Failed to load email template");
              } finally {
                setButtonLoading(null);
              }
            }}
          >
            Send Brochure
          </Button>
          <Button
            type="primary"
            className="themeDefaultButton"
            disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
            loading={buttonLoading === "quote"}
            onClick={async () => {
              if (!selectedRowKeys.length) return;
              setButtonLoading("quote");
              try {
                const data = await fetchEmailTemplate(String(selectedRowKeys[0]), "SEND QUOTE-OPEN");
                setModalTemplate(data?.email ?? null);
                setModalCompanies(data?.companies ?? null);
                setClickedBtn("quote");
                setModalOpen(true);
              } catch (err) {
                console.error(err);
                toast.error("Failed to load email template");
              } finally {
                setButtonLoading(null);
              }
            }}
          >
            Send Quote
          </Button>
          <Button
            type="default"
            htmlType="button"
            className="themeDefaultButton"
            onClick={() => setShowSidebarDrawer(true)}
            aria-label="Open notes and deposit panel"
          >
            <MoreVertical size={14} />
          </Button>
        </div>
      </div>

      {/* Main body */}
      <div>

        {/* Table section */}
        <div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Green header with search */}
            <div className="bg-primary px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 max-w-[340px]">
                <MagnifyingGlass w={18} h={18} />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or event details..."
                  className="w-full outline-none text-sm placeholder:text-gray-400"
                  style={{ backgroundColor: "transparent" }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>

            <DataTable<OpenEnquiryList>
              columns={columns}
              dataSource={enquiryData?.data}
              loading={isLoading}
              scroll={{ x: 600 }}
              rowKey={(data) => String(data.id)}
              pagination={{
                pageSize: params.limit,
                current: params.page,
                total: enquiryData?.meta?.total,
                onChange: (page, pageSize) =>
                  setParams({ ...params, page, limit: pageSize }),
              }}
              rowSelection={rowSelection}
              rowClassName={(_, index) =>
                index % 2 === 1 ? "[&>td]:bg-[#F7F7F5]" : ""
              }
              onRow={(record) => ({
                onClick: () => {
                  try {
                    const id = record?.id;
                    if (!id) return;
                    setSelectedRowKeys([String(id)]);
                    setSelectedRowData([record]);
                  } catch {}
                },
              })}
            />
          </div>
        </div>

      </div>

      {/* Notes + Deposit drawer — opened via the 3-dot button */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none transition-all duration-300 ${showSidebarDrawer ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!showSidebarDrawer}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${showSidebarDrawer ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
          onClick={() => setShowSidebarDrawer(false)}
        ></div>

        <aside
          className={`pointer-events-auto fixed right-0 top-0 h-full w-[380px] bg-white shadow-xl z-50 transform transition-transform duration-300 ${
            showSidebarDrawer ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-labelledby="sidebar-drawer-title"
        >
          <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gradient-to-r from-white to-slate-50">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Open Enquiry</p>
                <h3 id="sidebar-drawer-title" className="themeH1 text-lg mt-1">
                  {(selectedRowData?.[0]?.users_events_user_idTousers as { name?: string } | undefined)?.name || "Notes & Deposit"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSidebarDrawer(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close drawer"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="p-6 space-y-6">

                {/* Note input + Add button */}
                <div className="flex gap-2 items-stretch">
                  <textarea
                    placeholder="Add a note..."
                    rows={3}
                    className="flex-1 bg-white rounded-xl px-4 py-3 text-sm outline-none shadow-sm placeholder:text-gray-400 resize-none border border-gray-200 focus:border-primary/30 transition-colors"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button
                    type="button"
                    className="bg-primary text-white rounded-xl px-5 text-sm font-medium shadow-sm disabled:opacity-40 transition-opacity flex items-center justify-center min-w-[52px]"
                    disabled={!selectedRowKeys.length || !note.trim() || addingNote}
                    onClick={hanldeAddNote}
                  >
                    {addingNote ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                    ) : "Add"}
                  </button>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 px-4 pt-3 pb-2">Recent activites</p>
                  <div className="px-3 pb-3 h-56 overflow-y-auto no-scrollbar space-y-2">
                    {selectedRowData?.[0]?.event_notes?.length ? (
                      <ul className="space-y-2">
                        {selectedRowData?.[0]?.event_notes?.map((item) => (
                          <li
                            key={item.id}
                            className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border-l-4 border-primary shadow-sm"
                          >
                            {item.notes}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                        Select an enquiry to see notes
                      </div>
                    )}
                  </div>
                </div>

                {/* Deposit / Confirm form */}
                <div>
                  <form className="space-y-2.5" onSubmit={formik.handleSubmit}>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        className="w-full h-10"
                        placeholder="Company"
                        options={companyOptions}
                        value={formik.values.company_name || undefined}
                        onChange={(value) => formik.setFieldValue("company_name", value)}
                      />
                      <DatePicker
                        placeholder="Date"
                        className="w-full h-10"
                        format="DD/MM/YYYY"
                        value={
                          formik.values.event_date
                            ? dayjs(formik.values.event_date, "DD-MM-YYYY")
                            : undefined
                        }
                        onChange={(val) =>
                          formik.setFieldValue("event_date", val ? dayjs(val).format("DD-MM-YYYY") : "")
                        }
                        allowClear
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputNumber
                        placeholder="Amount"
                        className="w-full h-10"
                        style={{ width: "100%" }}
                        value={formik.values.deposit_amount ? Number(formik.values.deposit_amount) : undefined}
                        onChange={(val) => formik.setFieldValue("deposit_amount", val ?? "")}
                      />
                      <Select
                        placeholder="Payment"
                        className="w-full h-10"
                        value={formik.values.payment_method_id || undefined}
                        onChange={(val) => formik.setFieldValue("payment_method_id", val)}
                        options={[
                          { label: "Cash", value: "1" },
                          { label: "Bank Transfer", value: "2" },
                          { label: "Card", value: "3" },
                        ]}
                      />
                    </div>
                    <Button
                      type="primary"
                      className="w-full! h-10! font-semibold"
                      htmlType="submit"
                      loading={confirmingEvent}
                      disabled={!selectedRowKeys.length}
                    >
                      Deposit Received
                    </Button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <SendBrochureModal
          open={modalOpen}
          sendMode={clickedBtn}
          eventId={String(selectedRowKeys[0])}
          template={
            modalTemplate as {
              id?: string;
              email_name?: string;
              subject?: string;
              body?: string;
            } | null
          }
          companies={modalCompanies}
          onCancel={() => {
            setModalOpen(false);
            setButtonLoading(null);
            setModalTemplate(null);
            setModalCompanies(null);
          }}
        />
      )}
    </div>
  );
};

export default OpenEnquiryPage;
