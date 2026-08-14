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
import { MoreVertical } from "lucide-react";
import { useFormik } from "formik";
import { Select, DatePicker, TableColumnsType, InputNumber } from "antd";
import type { TableRowSelection } from "antd/es/table/interface";
import dayjs from "dayjs";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
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
  // Side panel is inline and shown by default; the 3-dot button toggles it.
  const [showSidePanel, setShowSidePanel] = useState(true);
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
      ellipsis: true,
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
      ellipsis: true,
    },
    {
      title: "Event Date",
      dataIndex: "date",
      key: "date",
      width: 140,
      ellipsis: true,
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

  // Single source of truth for whether a note can be saved — the button's
  // `disabled` and the Enter handler both read it, so the keyboard path can't
  // fire while the button is greyed out (e.g. a double-tap of Enter mid-save
  // posting the same note twice).
  const canAddNote = Boolean(selectedRowKeys.length) && Boolean(note.trim()) && !addingNote;

  const hanldeAddNote = () => {
    if (!canAddNote) return;
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

  // Auto-select the first enquiry so the side panel is populated on arrival.
  // Guarded by a ref keyed on the current search/page so it fires once per
  // result set — otherwise clearing a row would instantly re-select it and the
  // Edit/Delete buttons (which require an empty selection to disable) would
  // never turn off.
  const autoSelectedForRef = useRef<string | null>(null);
  useEffect(() => {
    const rows = enquiryData?.data;
    if (!rows?.length) return;
    const key = `${params.search}|${params.page}`;
    if (autoSelectedForRef.current === key) return;
    autoSelectedForRef.current = key;
    if (selectedRowKeys.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRowKeys([String(rows[0].id)]);
    setSelectedRowData([rows[0]]);
  }, [enquiryData, params.search, params.page, selectedRowKeys.length]);

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
            onClick={() => setShowSidePanel((v) => !v)}
            aria-label={showSidePanel ? "Hide notes and deposit panel" : "Show notes and deposit panel"}
          >
            <MoreVertical size={14} />
          </Button>
        </div>
      </div>

      {/* Main body.

          Flex rather than a 12-column grid, because the panel width has to match
          the New Enquiry page exactly and the useful value sits between two grid
          steps: `col-span-3` (25%) is too narrow, `col-span-4` (33%) too wide.
          Flex lets both pages state the same 29% directly instead of rounding to
          whichever column count happens to be available. */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* Table section — takes the remaining width, and all of it when the side
            panel is hidden. `min-w-0` is required: a flex item defaults to
            min-width:auto, so the table's own scroll container would refuse to
            shrink and push the panel off-screen instead. */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm [&_.ant-table-thead_th]:whitespace-nowrap [&_.ant-table-tbody_td]:whitespace-nowrap">
            {/* Green header with search — fixed height so the side panel
                header can line up with it exactly */}
            <div className="bg-primary px-4 h-[60px] flex items-center">
              <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 w-full max-w-[340px]">
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

        {/* Side panel — inline, visible by default, toggled by the 3-dot button.

            Geometry is shared with the New Enquiry page's summary panel: same
            `xl:col-span-4` width (it was `col-span-3` here, so the two pages
            disagreed), same sticky pin and same fixed full height. See the long
            comment on that page's `aside` for why the sticky offset is negative
            — briefly, a sticky offset resolves against the scroll container's
            content box, so the shell's `p-8` is added to whatever `top` says,
            and -24px cancels it back to a deliberate 32px from the top of the
            viewport with a matching 32px at the bottom. */}
        {showSidePanel && (
          <aside className="xl:w-[29%] xl:shrink-0">
            <div className="xl:sticky xl:-top-6 xl:h-[calc(100vh-64px)] flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header — same fixed height as the table's search header */}
              <div className="px-5 h-[60px] shrink-0 flex flex-col justify-center border-b border-gray-200 bg-gradient-to-r from-white to-slate-50">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">Open Enquiry</p>
                <h3 className="themeH1 text-base truncate leading-tight">
                  {(selectedRowData?.[0]?.users_events_user_idTousers as { name?: string } | undefined)?.name || "Notes & Deposit"}
                </h3>
              </div>

              {/* The note field and the deposit form are fixed-size; the
                  activity feed is the one part with an open-ended amount of
                  content, so it takes the slack (`flex-1`) and the panel fills
                  its height honestly instead of leaving dead space at the
                  bottom. `min-h-0` on both this column and the feed is what lets
                  them shrink below content size so the feed scrolls internally
                  rather than pushing the deposit form off the panel. */}
              <div className="flex-1 min-h-0 flex flex-col p-5 gap-5">

                {/* Note input + Add button — the signed-off layout, with the
                    field's height brought down from a 3-row textarea to a single
                    line and the button matched to it.

                    A single-line `input` rather than a short textarea is also
                    what makes Enter-to-save unambiguous: in a textarea Enter has
                    to keep meaning "new line", so quick-save would need a
                    modifier key nobody would discover. Notes on this panel are
                    one-liners in practice, so nothing is lost.

                    No "press Enter" hint is shown — Enter is a shortcut on top of
                    the button, not the primary affordance. */}
                <div className="flex gap-2 items-stretch h-10 shrink-0">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    aria-label="Add a note"
                    className="flex-1 min-w-0 bg-white rounded-xl px-4 text-sm outline-none shadow-sm placeholder:text-gray-400 border border-gray-200 focus:border-primary/30 transition-colors"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      // `isComposing` guards IME input, where Enter commits the
                      // candidate text rather than the field.
                      if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                      e.preventDefault();
                      if (!canAddNote) return;
                      hanldeAddNote();
                    }}
                  />
                  <button
                    type="button"
                    className="bg-primary text-white rounded-xl px-5 text-sm font-medium shadow-sm disabled:opacity-40 transition-opacity flex items-center justify-center min-w-[52px] shrink-0"
                    disabled={!canAddNote}
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

                {/* Recent Activities.
                    Separators are `gray-200` (#E5E7EB): `gray-100` (#F3F4F6) is
                    the correct token now that globals.css no longer overrides it
                    with #6B7280 — Tailwind's gray-*500* — but at this row height
                    it reads as almost nothing, so this lands one step up. Visible
                    hairline, nowhere near the heavy line it started as.

                    Rows are tight on purpose: a date and a one-line note are one
                    unit, so the padding between entries should be larger than the
                    gap inside an entry, not equal to it. */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <p className="shrink-0 text-sm font-medium text-gray-900 pb-2">Recent activities</p>
                  <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                    {selectedRowData?.[0]?.event_notes?.length ? (
                      <ul>
                        {selectedRowData?.[0]?.event_notes?.map((item) => (
                          <li
                            key={item.id}
                            className="py-1.5 border-b border-gray-200 last:border-0"
                          >
                            {item.created_at && (
                              <p className="text-[11px] leading-tight text-gray-400">
                                {dayjs(item.created_at).format("DD/MM/YY HH:mm")}
                              </p>
                            )}
                            <p className="text-xs leading-snug text-gray-600">{item.notes}</p>
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
                <div className="shrink-0">
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
          </aside>
        )}
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
