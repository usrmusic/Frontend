"use client";
import {
  useAddNote,
  useOpenEnquiryList,
  useDeleteEnquiry,
  useEnquiryStatusCounts,
} from "@/src/api/enquiry";
import { useConfirmEvent } from "@/src/api/events";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import {
  ListFilter,
  Phone,
  CalendarDays,
  Sparkles,
  MapPin,
  MessageSquare,
  Wallet,
  CreditCard,
  Plus,
} from "lucide-react";
import { useFormik } from "formik";
import {
  Select,
  DatePicker,
  TableColumnsType,
  InputNumber,
  Popover,
  Spin,
} from "antd";
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
import useRole from "@/src/hooks/useRole";
// using Ant Design inputs for date/amount

const initialParams: {
  page: number;
  limit: number;
  search: string;
  status?: "new" | "open" | "quoted";
  event_type?: string;
} = {
  page: 1,
  limit: 10,
  search: "",
};

import type { OpenEnquiryList } from "@/src/api/enquiry";

interface CompanyOption {
  id: number | string;
  name: string;
}

/* Status — derived from real stored flags rather than a dedicated status
   column (there isn't one; every row here is event_status_id=1). `quoted`
   and `called` are genuine booleans on the event, so this reads real
   progress rather than inventing a taxonomy: quoted -> "Quoted",
   contacted-but-not-quoted -> "Open", untouched -> "New". Rendered as plain
   coloured text, matching the reference design. */
function deriveStatus(row: OpenEnquiryList): {
  label: string;
  className: string;
} {
  if (row.quoted) return { label: "Quoted", className: "text-amber-500" };
  if (row.called) return { label: "Open", className: "text-blue-500" };
  return { label: "New", className: "text-emerald-500" };
}

/* Purely decorative trend line for the KPI cards — same convention the
   dashboard's own StatCardsRow already uses (a static chart image next to a
   number, not a computed sparkline), because per-day history for these
   specific counts isn't tracked. No numbers or labels here claim a trend;
   it's shape only. The path itself is the app's own /svgs/red-chart.svg
   asset (same wavy trend-line shape already used on the dashboard's stat
   cards), recoloured per card rather than invented fresh, so this stays
   visually consistent with the one sparkline style the app already has. */
function Sparkline({ id, stroke }: { id: string; stroke: string }) {
  return (
    <svg width="60" height="41" viewBox="0 0 60 41" fill="none" aria-hidden>
      <path
        d="M1.21484 39.45L8.68659 35.7132C8.90741 35.6028 9.07957 35.4146 9.16992 35.1848L11.0192 30.4823C11.2679 29.8496 12.0619 29.6443 12.5862 30.0769L13.9518 31.2037C14.4994 31.6555 15.3303 31.4088 15.5425 30.7313L24.5703 1.91614C24.874 0.946735 26.2621 0.995282 26.4974 1.98353L31.0089 20.9365C31.2247 21.8431 32.4541 21.9877 32.8743 21.1558L36.4584 14.0604C36.8332 13.3184 37.8971 13.3311 38.2541 14.0818L44.7433 27.7301C45.0635 28.4035 45.9815 28.5023 46.4376 27.9123L48.8769 24.7569C49.1921 24.3493 49.7654 24.2478 50.2013 24.5225L51.6627 25.4436C52.1611 25.7577 52.8217 25.5751 53.088 25.0495L58.4943 14.378"
        stroke={`url(#${id})`}
        strokeWidth="2.43"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id={id}
          x1="60.2148"
          y1="19.45"
          x2="-3.28516"
          y2="39.4499"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={stroke} stopOpacity="0" />
          <stop offset="1" stopColor={stroke} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Note input + Add Note button. Used in both the Details tab (below Record
   Deposit) and the Notes tab (below the activity list) — same control in
   both places rather than two separately-typed copies. A single-line `input`
   rather than a short textarea is what makes Enter-to-save unambiguous: in a
   textarea Enter has to keep meaning "new line". Notes on this panel are
   one-liners in practice, so nothing is lost. */
function AddNoteControl({
  note,
  setNote,
  canAddNote,
  addingNote,
  onSubmit,
}: {
  note: string;
  setNote: (v: string) => void;
  canAddNote: boolean;
  addingNote: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex gap-2 items-stretch">
      <input
        type="text"
        placeholder="Add a note..."
        aria-label="Add a note"
        className="flex-1 min-w-0 h-10 bg-white rounded-xl px-4 text-sm outline-none shadow-sm placeholder:text-gray-400 border border-gray-200 focus:border-primary/30 transition-colors"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          // `isComposing` guards IME input, where Enter commits the
          // candidate text rather than the field.
          if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
          e.preventDefault();
          if (!canAddNote) return;
          onSubmit();
        }}
      />
      <button
        type="button"
        className="h-10 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-xl px-5 text-sm font-medium shadow-sm disabled:opacity-40 transition-colors flex items-center justify-center min-w-[52px]"
        disabled={!canAddNote}
        onClick={onSubmit}
      >
        {addingNote ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
            />
          </svg>
        ) : (
          "Add"
        )}
      </button>
    </div>
  );
}

const OpenEnquiryPage = () => {
  // Confirming a deposit is how an enquiry becomes a confirmed event —
  // Admin/Super Admin only, matching Laravel's Deposit form
  // (@hasrole('Super Admin|Admin')) and its Confirm Event button.
  const { isAdmin } = useRole();
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
  const [activeTab, setActiveTab] = useState<"details" | "notes">("details");

  const { data: enquiryData, isLoading } = useOpenEnquiryList(params);
  // A separate, small fetch purely to build the Event Type filter's option
  // list from real distinct dj_package_name values — not the source of the
  // table's rows (that's the real, backend-filtered `enquiryData` above).
  const eventTypeSourceParams = { page: 1, limit: 100, search: "" };
  const { data: allEnquiryData } = useOpenEnquiryList(eventTypeSourceParams);
  const { data: companyNameOptions } = useCompanyDropdown();
  const { data: statusCounts, isLoading: isLoadingStatusCounts } =
    useEnquiryStatusCounts();

  const { mutate: addNoteMutation, isPending: addingNote } = useAddNote();
  const { mutate: confirmEventMutation, isPending: confirmingEvent } =
    useConfirmEvent();
  const deleteEnquiry = useDeleteEnquiry();
  const router = useRouter();

  // Real filters — sent to the backend as query params (status/event_type on
  // listOpenEnquiries), not applied client-side. "Status" here still means
  // the per-enquiry New/Open/Quoted derivation (called/quoted) used for
  // filtering which OPEN enquiries to show — a narrower, different concept
  // from the KPI cards' business-wide Open/Closed (event_status_id), which
  // cover the whole event lifecycle, not just this page's open-enquiry rows.
  const [statusFilter, setStatusFilter] = useState<
    "" | "new" | "open" | "quoted"
  >("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasActiveFilters = Boolean(statusFilter || eventTypeFilter);

  const eventTypeOptions = useMemo(() => {
    const rows = allEnquiryData?.data ?? [];
    const names = new Set<string>();
    rows.forEach((r) => {
      const v = r.dj_package_name as string | undefined;
      if (v) names.add(v);
    });
    return Array.from(names)
      .sort()
      .map((v) => ({ label: v, value: v }));
  }, [allEnquiryData]);

  // Push filter changes into the same `params` the table's real query uses —
  // reset to page 1 so a filter change doesn't strand the view on an
  // out-of-range page of the new, smaller result set.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams((prev) => ({
      ...prev,
      status: statusFilter || undefined,
      event_type: eventTypeFilter || undefined,
      page: 1,
    }));
  }, [statusFilter, eventTypeFilter]);

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
      width: 150,
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
      width: 120,
      ellipsis: true,
      sorter: (a, b) =>
        dayjs(a.date as string).valueOf() - dayjs(b.date as string).valueOf(),
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      // Real field (dj_package_name) — labelled to match the reference
      // design's "Event Type" column, since a DJ package name in this CRM
      // (Wedding Package, Destination Wedding, ...) IS the event type.
      title: "Event Type",
      dataIndex: "dj_package_name",
      key: "event_type",
      width: 150,
      ellipsis: true,
      render: (value: string) => value || "—",
    },
    // Status column removed — the KPI cards now use event_status_id, and
    // every row on this page is event_status_id=1 by definition, so a
    // per-row New/Open/Quoted column no longer matches what "status" means
    // elsewhere on this page. deriveStatus is still used by the side panel
    // (a per-record detail, not a table column) and by the Status filter in
    // the Filters popover.
  ];

  // Single source of truth for whether a note can be saved — the button's
  // `disabled` and the Enter handler both read it, so the keyboard path can't
  // fire while the button is greyed out (e.g. a double-tap of Enter mid-save
  // posting the same note twice).
  const canAddNote =
    Boolean(selectedRowKeys.length) && Boolean(note.trim()) && !addingNote;

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

  const searchParams = useSearchParams();

  // Auto-select an enquiry so the side panel is populated on arrival.
  // Guarded by a ref keyed on the current search/page (+ the incoming
  // `select` id, if any) so it fires once per result set — otherwise
  // clearing a row would instantly re-select it and the Edit/Delete buttons
  // (which require an empty selection to disable) would never turn off.
  //
  // A deep link from the dashboard (e.g. Open Enquiries widget) arrives as
  // `?search=<id>&name=<clientName>&select=<id>` — the search box is seeded
  // with the client's NAME (see the effect below), not the id, since the
  // backend search matches name/mobile/details, not id. That means the
  // filtered result set can legitimately contain more than one row (two
  // enquiries from the same client), so falling back to "just select the
  // first row" doesn't reliably land on the specific enquiry that was
  // clicked. `select` carries the exact id for that: prefer it whenever
  // present and found in the loaded rows, before falling back to "first row".
  const autoSelectedForRef = useRef<string | null>(null);
  useEffect(() => {
    const rows = enquiryData?.data;
    if (!rows?.length) return;
    const selectId = searchParams?.get("select") ?? "";
    const key = `${params.search}|${params.page}|${selectId}`;
    if (autoSelectedForRef.current === key) return;
    autoSelectedForRef.current = key;
    if (selectId) {
      const found = rows.find((r) => String(r.id) === selectId);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedRowKeys([String(found.id)]);
        setSelectedRowData([found]);
        return;
      }
    }
    if (selectedRowKeys.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRowKeys([String(rows[0].id)]);
    setSelectedRowData([rows[0]]);
  }, [
    enquiryData,
    params.search,
    params.page,
    selectedRowKeys.length,
    searchParams,
  ]);

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

  const selected = selectedRowData?.[0];
  const selectedName =
    (selected?.users_events_user_idTousers as { name?: string } | undefined)
      ?.name || "";
  const selectedStatus = selected ? deriveStatus(selected) : null;
  const selectedVenue = (selected?.venues as { venue?: string } | undefined)
    ?.venue;
  const selectedMobile = (
    selected?.users_events_user_idTousers as
      { contact_number?: string } | undefined
  )?.contact_number;
  const selectedEventType =
    (selected?.dj_package_name as string | undefined) || undefined;
  const selectedMessage =
    (selected?.details as string | undefined) ||
    (selected?.event_details as string | undefined);
  const selectedDate = selected?.date as string | undefined;
  // deposit_amount is a Prisma Decimal — serializeForJson doesn't special-case
  // it, so a set value can arrive as {d:[...], e, s} rather than a plain
  // number (same shape handled defensively on the New Enquiry edit page).
  // Currently always null for open enquiries in practice (a deposit is only
  // ever recorded via the confirm flow below), but unpacked the same way here
  // so this doesn't silently render "[object Object]" if that ever changes.
  const selectedDeposit = ((d) => {
    if (d == null) return undefined;
    if (typeof d === "object") {
      const obj = d as { d?: unknown[]; amount?: unknown };
      if (Array.isArray(obj.d) && obj.d.length)
        return obj.d[0] as number | string;
      if (obj.amount != null) return obj.amount as number | string;
      return undefined;
    }
    return d as number | string;
  })(selected?.deposit_amount);
  const notesCount = selected?.event_notes?.length ?? 0;

  return (
    <div className="mt-8 space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="shrink-0">
            <BackButton />
          </Link>
          <div>
            <h2 className="themeH1">Open Enquiry</h2>
            <p className="text-sm text-gray-500">
              Manage and respond to your enquiries
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/enquiry">
            <Button type="primary" className="themeDefaultButton">
              <Plus size={14} className="mr-1 inline" />
              New Enquiry
            </Button>
          </Link>
          <Button
            type="default"
            className="themeDefaultButton"
            disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
            onClick={() => {
              if (!selectedRowKeys.length) return;
              router.push(
                `/enquiry?select=${encodeURIComponent(String(selectedRowKeys[0]))}`,
              );
            }}
          >
            Edit
          </Button>
          <Button
            type="default"
            className="themeDefaultButton"
            disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
            loading={buttonLoading === "delete"}
            onClick={() => {
              if (!selectedRowKeys.length) return;
              Modal.confirm({
      icon: null,
                rootClassName: "usr-confirm-modal",
                title: "Delete enquiry",
                content:
                  "Are you sure you want to delete this enquiry? This action cannot be undone. This will permanently remove the enquiry and related temporary data.",
                centered: true,
                maskClosable: false,
                okText: "Delete",
                okButtonProps: {
                  type: "primary",
                },
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
                const data = await fetchEmailTemplate(
                  String(selectedRowKeys[0]),
                  "EMAIL FOR UPDATE",
                );
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
                const data = await fetchEmailTemplate(
                  String(selectedRowKeys[0]),
                  "EMAIL BROCHURE",
                );
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
                const data = await fetchEmailTemplate(
                  String(selectedRowKeys[0]),
                  "SEND QUOTE-OPEN",
                );
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
        </div>
      </div>

      {/* Main body — three visual zones: KPI cards + search/table stacked as
          one left column, and the side panel as a full-height sibling next to
          ALL of it (not just the table) — the panel's sticky wrapper spans
          from the top of the KPI row to the bottom of the table, matching the
          reference design's box layout.

          Flex rather than a 12-column grid, because the panel width has to match
          the New Enquiry page exactly and the useful value sits between two grid
          steps: `col-span-3` (25%) is too narrow, `col-span-4` (33%) too wide.
          Flex lets both pages state the same 29% directly instead of rounding to
          whichever column count happens to be available. */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left column: KPI cards, search/filters, table. `min-w-0` is
            required: a flex item defaults to min-width:auto, so the table's
            own scroll container would refuse to shrink and push the panel
            off-screen instead. */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* KPI row — business-wide, event_status_id based (not scoped to
              this page's own open-enquiry rows): Total is every event
              regardless of status; Open = OPEN + CONFIRMED (booked but
              nothing about it is finished yet); Closed = COMPLETED +
              CANCELLED (the event has run its course, either way). Backed by
              GET /enquiry/status-counts — see getStatusCounts in
              enquiry.controller.js for the exact grouping. Open + Closed
              always exactly equals Total; no event falls outside both. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              variant="white"
              className="p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">Total</p>
                {isLoadingStatusCounts ? (
                  <Spin size="small" className="mt-2 block" />
                ) : (
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {statusCounts?.total ?? "—"}
                  </p>
                )}
              </div>
              <Sparkline id="oe-spark-total" stroke="#10b981" />
            </Card>
            <Card
              variant="white"
              className="p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">Open</p>
                {isLoadingStatusCounts ? (
                  <Spin size="small" className="mt-2 block" />
                ) : (
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {statusCounts?.open ?? "—"}
                  </p>
                )}
              </div>
              <Sparkline id="oe-spark-open" stroke="#3b82f6" />
            </Card>
            <Card
              variant="white"
              className="p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">Closed</p>
                {isLoadingStatusCounts ? (
                  <Spin size="small" className="mt-2 block" />
                ) : (
                  <p className="text-3xl font-semibold text-gray-900 mt-1">
                    {statusCounts?.closed ?? "—"}
                  </p>
                )}
              </div>
              <Sparkline id="oe-spark-closed" stroke="#f59e0b" />
            </Card>
          </div>

          {/* Search + Filters + Table — ONE continuous white box, not two
              separate cards stacked with a gap. The search/filter row is an
              internal header strip (bottom hairline only) directly above the
              table, matching the reference design. Search fills the left
              side, a vertical divider, then Filters as the right-hand segment
              of the same control. Filters opens a real popover (Status +
              Event Type), not a decorative button — both options are derived
              from real data (Status from the same New/Open/Quoted derivation
              used elsewhere on this page; Event Type from the distinct
              dj_package_name values actually present), nothing invented. */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-2 py-2 flex items-center gap-0 border-b border-gray-100">
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
                <MagnifyingGlass w={18} h={18} />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or event details..."
                  className="w-full outline-none text-sm bg-transparent placeholder:text-gray-400"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="w-px self-stretch bg-gray-200 mx-1" />
              <Popover
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                trigger="click"
                placement="bottomRight"
                content={
                  <div className="w-64 space-y-3 py-1">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Status
                      </p>
                      <Select
                        className="w-full"
                        allowClear
                        placeholder="Any status"
                        value={statusFilter || undefined}
                        onChange={(v) =>
                          setStatusFilter((v as typeof statusFilter) || "")
                        }
                        options={[
                          { label: "New", value: "new" },
                          { label: "Open", value: "open" },
                          { label: "Quoted", value: "quoted" },
                        ]}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Event Type
                      </p>
                      <Select
                        className="w-full"
                        allowClear
                        placeholder="Any event type"
                        value={eventTypeFilter || undefined}
                        onChange={(v) => setEventTypeFilter(v || "")}
                        options={eventTypeOptions}
                      />
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="text-xs font-medium text-primary"
                        onClick={() => {
                          setStatusFilter("");
                          setEventTypeFilter("");
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                }
              >
                <button
                  type="button"
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    hasActiveFilters
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ListFilter size={15} />
                  Filters
                  {hasActiveFilters && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </button>
              </Popover>
              <button
                type="button"
                className="xl:hidden shrink-0 rounded-lg border border-gray-200 ml-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => setShowSidePanel((v) => !v)}
              >
                {showSidePanel ? "Hide panel" : "Show panel"}
              </button>
            </div>

            <div className="[&_.ant-table-thead_th]:whitespace-nowrap [&_.ant-table-tbody_td]:whitespace-nowrap">
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
                  // AntD only shows the size-changer by default once total
                  // exceeds a threshold — Open Enquiry's ~31 rows fell below
                  // it, so the dropdown silently never rendered.
                  showSizeChanger: true,
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
                  onDoubleClick: () => {
                    const id = record?.id;
                    if (!id) return;
                    router.push(
                      `/enquiry?select=${encodeURIComponent(String(id))}`,
                    );
                  },
                })}
              />
            </div>
          </div>
        </div>

        {/* Side panel — inline, visible by default, toggled by the top-bar
            button on small screens.

            Geometry is shared with the New Enquiry page's summary panel: same
            `xl:col-span-4` width (it was `col-span-3` here, so the two pages
            disagreed).

            Height is deliberately NOT viewport-based (`100vh`) as the SOLE
            source of truth — mobile browsers in "Desktop site" mode still
            report their own real, address-bar-shrunk viewport height, so a
            `100vh`-derived FIXED height overflows well past the actual
            visible area ("goes to the end"). Instead this relies on plain
            flexbox stretch as the baseline: the outer container is
            `flex xl:flex-row` with default `align-items: stretch`, so once
            it's row layout (xl and up) the aside is automatically stretched
            to match the left column's real height — i.e. it ends exactly
            where the table ends on a normal page. `h-full` on the inner div
            consumes that stretched height.

            `xl:max-h-[calc(100vh-64px)]` is a CEILING on top of that, not a
            replacement for it — a day with a very long table (many rows, or
            a long note thread in the panel itself) would otherwise stretch
            the panel taller than the viewport with nothing to scroll it back
            into view. Capping it means the panel's own internal scroll
            regions (the tab content areas below) take over once its natural
            height would exceed the screen, instead of the whole page just
            growing. Below xl the container stacks in a column, so there's
            nothing to stretch OR cap against — the panel takes its natural
            content height there, which is already correct. */}
        {showSidePanel && (
          <aside className="xl:w-[29%] xl:shrink-0">
            <div className="h-full xl:max-h-[calc(100vh-64px)] xl:sticky xl:-top-6 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header — name, with the derived status directly underneath
                  it (matching the reference design's stacked layout). No
                  phone/edit/overflow icon buttons here — the table's own
                  action row above already covers Edit, and there's no calling
                  feature in this CRM to wire a phone icon to. */}
              <div className="px-5 py-4 shrink-0 border-b border-gray-200 bg-gradient-to-r from-white to-slate-50">
                <h3 className="themeH1 text-base truncate leading-tight">
                  {selectedName || "Notes & Deposit"}
                </h3>
                {selectedStatus && (
                  <span
                    className={`text-xs font-medium mt-1 inline-flex items-center gap-1 ${selectedStatus.className}`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {selectedStatus.label}
                  </span>
                )}
              </div>

              {/* Tabs — Details / Notes, matching the reference design's
                  structure. Everything shown is a real field; nothing here is
                  a placeholder for a feature the CRM doesn't have. */}
              <div className="shrink-0 flex border-b border-gray-100 px-5">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === "details"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === "notes"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Notes {notesCount > 0 ? `(${notesCount})` : ""}
                </button>
              </div>

              {/* Record Deposit — shared, persistent action pinned right
                  under the tabs (visible regardless of which tab is active),
                  matching the original pre-redesign position. Admin only. */}
              {isAdmin && (
                <div className="shrink-0 p-5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-2.5">
                    Record Deposit
                  </p>
                  <form className="space-y-2.5" onSubmit={formik.handleSubmit}>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        className="w-full h-10"
                        placeholder="Company"
                        options={companyOptions}
                        value={formik.values.company_name || undefined}
                        onChange={(value) =>
                          formik.setFieldValue("company_name", value)
                        }
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
                          formik.setFieldValue(
                            "event_date",
                            val ? dayjs(val).format("DD-MM-YYYY") : "",
                          )
                        }
                        allowClear
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputNumber
                        placeholder="Amount"
                        className="w-full h-10"
                        style={{ width: "100%" }}
                        value={
                          formik.values.deposit_amount
                            ? Number(formik.values.deposit_amount)
                            : undefined
                        }
                        onChange={(val) =>
                          formik.setFieldValue("deposit_amount", val ?? "")
                        }
                      />
                      <Select
                        placeholder="Payment"
                        className="w-full h-10"
                        value={formik.values.payment_method_id || undefined}
                        onChange={(val) =>
                          formik.setFieldValue("payment_method_id", val)
                        }
                        options={[
                          { label: "Cash", value: "1" },
                          { label: "BACS", value: "2" },
                          { label: "Other", value: "3" },
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
              )}

              <div className="flex-1 min-h-0 flex flex-col">
                {/* Tab content — scrolls independently of Record Deposit
                    above, which is a PERSISTENT element pinned under the tabs
                    (matching the reference design: it stays put whether
                    Details or Notes is the active tab, rather than only
                    appearing under Notes). */}
                {activeTab === "details" ? (
                  <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                    {/* Deposit/Add Note both moved out of here — they're now
                        shared, persistent bottom elements rendered once below
                        (Deposit) so they're visible regardless of tab, and
                        Add Note lives only in the Notes tab now, at its top.
                        Detail rows — icon + label + value, in the same order
                        as the reference design: Mobile, Event Date, Event
                        Type, Location, Message, Amount, Payment Status. All
                        real, selected-row fields — "--" shown for whichever
                        of Amount/Payment Status has no deposit recorded yet,
                        same as the reference. */}
                    {/* Label/value sizing here matches the rest of the site's
                        "label above value" convention (see the shared Input
                        component and the Filters popover just above: text-xs
                        label, text-sm value) rather than the smaller
                        11px/gray-400 this box used before. */}
                    <div className="p-5 space-y-4 border-b border-gray-100">
                      <div className="flex items-start gap-2.5">
                        <Phone
                          size={15}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 leading-tight">
                            Mobile
                          </p>
                          <p className="text-sm text-gray-900 truncate">
                            {selectedMobile || "--"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CalendarDays
                          size={15}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 leading-tight">
                            Event Date
                          </p>
                          <p className="text-sm text-gray-900">
                            {selectedDate
                              ? dayjs(selectedDate).format("DD/MM/YYYY")
                              : "--"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Sparkles
                          size={15}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 leading-tight">
                            Event Type
                          </p>
                          <p className="text-sm text-gray-900 truncate">
                            {selectedEventType || "--"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin
                          size={15}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 leading-tight">
                            Location
                          </p>
                          <p className="text-sm text-gray-900 truncate">
                            {selectedVenue || "--"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MessageSquare
                          size={15}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 leading-tight">
                            Message
                          </p>
                          <p className="text-sm text-gray-900 leading-snug">
                            {selectedMessage || "--"}
                          </p>
                        </div>
                      </div>
                      {/* <div className="flex items-start gap-2.5">
                        <Wallet size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400 leading-tight">Amount</p>
                          <p className="text-sm text-gray-800">
                            {selectedDeposit ? `£${Number(selectedDeposit).toLocaleString()}` : "--"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CreditCard size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400 leading-tight">Payment Status</p>
                          <p className="text-sm text-gray-800">
                            {selectedDeposit ? "Deposit Received" : "--"}
                          </p>
                        </div>
                      </div> */}
                    </div>
                  </div>
                ) : (
                  /* Notes tab — Add Note at the TOP (matching the original,
                     pre-redesign layout), Recent Activities below it,
                     scrolling on its own.
                     Separators are `gray-200` (#E5E7EB): `gray-100` (#F3F4F6) is
                     the correct token now that globals.css no longer overrides it
                     with #6B7280 — Tailwind's gray-*500* — but at this row height
                     it reads as almost nothing, so this lands one step up. Visible
                     hairline, nowhere near the heavy line it started as.

                     Rows are tight on purpose: a date and a one-line note are one
                     unit, so the padding between entries should be larger than the
                     gap inside an entry, not equal to it. */
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="shrink-0 p-5 pb-3 border-b border-gray-100">
                      <AddNoteControl
                        note={note}
                        setNote={setNote}
                        canAddNote={canAddNote}
                        addingNote={addingNote}
                        onSubmit={hanldeAddNote}
                      />
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pt-3">
                      {selectedRowData?.[0]?.event_notes?.length ? (
                        <ul>
                          {selectedRowData?.[0]?.event_notes?.map((item) => (
                            <li
                              key={item.id}
                              className="py-1.5 border-b border-gray-200 last:border-0"
                            >
                              {/* Same note+timestamp sizing as the dashboard's
                                  Events Activity feed (EventActivity.tsx) —
                                  same content type, so it should read the
                                  same: sm/gray-700 for the note text, xs/
                                  gray-400 for the meta line, not the smaller
                                  11px/xs pairing this used before. */}
                              {item.created_at && (
                                <p className="text-xs leading-tight text-gray-400">
                                  {dayjs(item.created_at).format(
                                    "DD/MM/YY HH:mm",
                                  )}
                                </p>
                              )}
                              <p className="text-sm leading-snug text-gray-700">
                                {item.notes}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="h-full flex items-center justify-center text-sm text-gray-500">
                          No notes yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
