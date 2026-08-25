"use client";
import { useRigListEventsDropdown } from "@/src/api/dropdown";
import {
  useCancelEvent,
  useDownloadInvoice,
  useGetConfirmEvent,
  useUpdateConfirmEvent,
} from "@/src/api/events";
import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import EventPaymentDrawer from "@/src/components/common/EventPaymentDrawer";
import { Collapse, CollapseProps, Select, Spin, Modal } from "antd";
import dayjs from "dayjs";
import { useFormik } from "formik";
import {
  ChevronDown,
  FileText,
  FolderOpen,
  MoreVertical,
  SquareCheckBig,
  X,
} from "lucide-react";
import Link from "next/link";
import { CSSProperties, useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { ConfirmEventData, EventsDropdownItem, ConfirmEventPayment, ConfirmEventNote, ConfirmEventPackage } from "@/src/types/types";
import SendBrochureModal from "../open-enquiry/SendBrochure";
import { toast } from "react-toastify";
import { fetchEmailTemplate } from "@/src/api/enquiry";
import Files from "./Files";
import Contracts from "./Contracts";
import Todos from "./_components/Todos";
import { parseTimeTo24 } from "@/src/utils/timeConverter";
import { useSendConfirmInvoice, useRefundConfirmEvent } from "@/src/api/events";
import { SendInvoiceModal } from "./_components/SendInvoiceModal";
import { RefundModal } from "./_components/RefundModal";
import useRole from "@/src/hooks/useRole";

const ConfirmedEventsPage = () => {
  // Add Payment / Refund are Admin-only, matching the legacy Laravel CRM
  // (sidebar_ui_new.blade.php's Add Payment form and confirmed_events.blade.php's
  // Refund button both only render inside @hasrole('Super Admin|Admin')).
  const { isAdmin, isClient } = useRole();
  const [eventId, setEventId] = useState("");
  const [sendMode, setSendMode] = useState<"invoice" | "quote">("quote");
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState<null>(null);
  const [modalCompanies, setModalCompanies] = useState<Array<{
    id: string | number;
    name: string;
  }> | null>(null);

  const { mutate: updateEventMutation, isPending } = useUpdateConfirmEvent();
  const { mutate: downloadInvoiceMutation, isPending: isDownloadingInvoice } =
    useDownloadInvoice();
  const { mutate: cancelEventMutation, isPending: isCancelingEvent } =
    useCancelEvent();
  const { data: eventsDropdown } = useRigListEventsDropdown();
  const { data: selectedEventData, isLoading } = useGetConfirmEvent(eventId);
  const router = useRouter();
  const { mutate: sendInvoiceMutation, isPending: isSendingInvoice } =
    useSendConfirmInvoice();
  const { mutate: refundMutation, isPending: isProcessingRefund } =
    useRefundConfirmEvent();
  const queryClient = useQueryClient();
  // Payment form state, rig-list toggle/print, and the print effect now live
  // inside EventPaymentDrawer (src/components/common/EventPaymentDrawer.tsx) —
  // extracted so the dashboard's Pending Payments card can open the exact same
  // drawer. Grepped clean before removal: none of these were referenced
  // anywhere on this page outside the drawer's own markup.
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [invoiceTemplate, setInvoiceTemplate] = useState<{ subject: string; body: string } | null>(null);

  const eventsOptions = (eventsDropdown?.data as EventsDropdownItem[])?.map(
    (item) => ({
      label: `${dayjs(item.date).format("DD/MM/YYYY")} - ${item.venues?.venue} (${item.users_events_user_idTousers?.name})`,
      // normalize to string so Select value/search is consistent
      value: String(item.id),
    }),
  );

  useEffect(() => {
    if (eventsDropdown?.data?.[0]?.id && !eventId) {
      setEventId(String(eventsDropdown.data[0].id));
    }
  }, [eventsDropdown?.data, eventId]);

  const getInitialValues = (data?: ConfirmEventData) => ({
    first_name: data?.users_events_user_idTousers?.name || "",
    email: data?.users_events_user_idTousers?.email || "",
    phone_number: data?.users_events_user_idTousers?.contact_number || "",
    venue: data?.venues?.venue || data?.venue || "",
    djName: data?.users_events_dj_idTousers?.name || data?.dj_package_name || "",
    videography: data?.videography || "",
    caterer: data?.caterer || "",
    decor: data?.decor || "",
    name: data?.couple_name || "",
    entranceSong: data?.entrance_song_style || "",
    cakeCutSong: data?.cake_song_who_feeds || "",
    firstDance: data?.first_dance || "",
    dos: data?.do || "",
    stagTuneAndDestination: data?.stag_songs || "",
    date: data?.date ? dayjs(data?.date).format("YYYY-MM-DD") : "",
    start_time: data?.start_time ? dayjs(data.start_time).format("HH:mm") : "",
    end_time: data?.end_time ? dayjs(data.end_time).format("HH:mm") : "",
    accessDate: data?.access_time || "",
    eventDateContact: data?.event_date_contact || "",
    noOfGuests: data?.no_of_guests || "",
    depositAmount: data?.deposit_amount || "",
    createdBy: data?.created_by || "",
    briefItinerary: data?.brief_itinerary || "",
    donts: data?.dont || "",
    henTuneAndDestination: data?.hen_songs || "",
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialValues(
      selectedEventData?.data as ConfirmEventData | undefined,
    ),
    onSubmit: (values) => {
      updateEventMutation(
        {
          values: {
            // User Info
            first_name: values.first_name || null,
            email: values.email || null,
            phone_number: values.phone_number
              ? Number(values.phone_number)
              : null,

            // DJ & Vendors (dj_name omitted — DJ is set at enquiry time, not editable here)
            videography: values.videography || null,
            caterer: values.caterer || null,
            decor: values.decor || null,

            // Event Info
            couple_name: values.name || null,
            date: values.date ? dayjs(values.date).format("DD-MM-YYYY") : null,
            start_time: values.start_time || null,
            end_time: values.end_time || null,
            access_time: values.accessDate || null,
            no_of_guests: values.noOfGuests ? Number(values.noOfGuests) : null,
            deposit_amount: values.depositAmount
              ? Number(values.depositAmount)
              : null,

            // Notes & Itinerary
            brief_itinerary: values.briefItinerary || null,
            do: values.dos || null,
            dont: values.donts || null,
            entrance_song_style: values.entranceSong || null,
            cake_song_who_feeds: values.cakeCutSong || null,
            first_dance: values.firstDance || null,
            stag_songs: values.stagTuneAndDestination || null,
            hen_songs: values.henTuneAndDestination || null,

            // Contact (single field, Laravel parity)
            event_date_contact: values.eventDateContact || null,
            signature_image: signatureImage || null,
          },
          id: eventId,
        },
        {
          onSuccess: () => {
            setIsModifyMode(false);
            setSignatureImage(null);
            toast.success("Event updated successfully");
          },
        },
      );
    },
  });

  const handleCancelEvent = () => {
    Modal.confirm({
      title: "Confirm cancellation",
      content: "Are you sure you want to cancel this event?",
      okText: "Yes",
      cancelText: "No",
      centered: true,
      onOk() {
        cancelEventMutation(
          { id: eventId },
          {
            onSuccess: () => {
              setEventId("");
            },
            onError: () => {
              toast.error("Failed to cancel event");
            },
          }
        );
      },
    });
  };

  const handleDownloadInvoice = () => {
    if (!eventId) {
      toast.error("No event selected");
      return;
    }
    downloadInvoiceMutation(
      { id: eventId },
      {
        onError: () => {
          toast.error("Failed to download invoice");
        },
      }
    );
  };

  const searchParams = useSearchParams();
  const searchParamsKey = searchParams?.toString() ?? "";
  // Fire once per incoming URL (not per eventId change) — otherwise picking
  // a different event from the dropdown below re-triggers this effect (its
  // deps included eventId) and it immediately snaps the selection back to
  // whatever `search` was in the URL, which never gets cleared, so the user
  // could never change events after arriving via a dashboard/calendar link.
  const eventIdSyncedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (eventIdSyncedForRef.current === searchParamsKey) return;
    eventIdSyncedForRef.current = searchParamsKey;
    const s = searchParams?.get("search") ?? "";
    if (s) {
      setEventId(String(s));
      setIsModifyMode(false);
    }
  }, [searchParams, searchParamsKey]);

  const payments =
    (selectedEventData?.data as ConfirmEventData)?.event_payments ?? [];
  const paymentsSum = (selectedEventData?.data?.event_payments || []).reduce(
    (s: number, p: ConfirmEventPayment) => s + Number(p.amount || p.payment_amount || 0),
    0,
  );
  const eventRefundAmount = Number(selectedEventData?.data?.refund_amount || 0) || 0;
  const adjustedPaidAmount = Math.max(0, paymentsSum - eventRefundAmount);
  const eventNotes =
    (selectedEventData?.data as ConfirmEventData)?.event_notes ?? [];

  const panelStyle: CSSProperties = {
    marginBottom: 14,
    background: "#fff",
    borderRadius: "12px",
    border: "none",
  };

  const getItems: (panelStyle: CSSProperties) => CollapseProps["items"] = (
    panelStyle,
  ) => [
    {
      key: "1",
      label: (
        <div className="flex items-center gap-1">
          <FileText size={14} />
          Contracts
        </div>
      ),
      children: <Contracts data={selectedEventData?.data} isModifyMode={isModifyMode} onSignatureChange={setSignatureImage} />,
      style: panelStyle,
    },
    {
      key: "2",
      label: (
        <div className="flex items-center gap-1">
          <FolderOpen size={14} />
          <span>Files</span>
          <span>{`(${selectedEventData?.data?.file_uploads?.length ?? 0})`}</span>
        </div>
      ),
      children: (
        <Files
          dataSource={selectedEventData?.data?.file_uploads}
          isModifyMode={isModifyMode}
          eventId={eventId}
        />
      ),
      style: panelStyle,
    },
    {
      key: "3",
      label: (
        <div className="flex items-center gap-1">
          <SquareCheckBig size={14} />
          To do List
        </div>
      ),
      children: <Todos isEditMode={isModifyMode} eventId={eventId} />,
      style: panelStyle,
    },
  ];

  return (
    <div>
      <form className="mt-4 space-y-4" onSubmit={formik.handleSubmit}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="shrink-0">
              <BackButton />
            </Link>
            <h2 className="themeH1">{(searchParams?.get("from") ?? "") === "completed" ? "Completed Event" : "Confirmed Events"}</h2>
          </div>
          <div className="flex gap-2">
            {eventId && (
              <>
                {isModifyMode ? (
                  <>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isPending}
                    >
                      Update
                    </Button>
                    <Button onClick={() => setIsModifyMode(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    htmlType="button"
                    onClick={() => setIsModifyMode(true)}
                  >
                    Modify
                  </Button>
                )}
                {/* Cancel Event / Send Quote / Send Invoice: Admin + Staff only.
                    Laravel's Client-facing confirmed_events_client.blade.php
                    toolbar is just Modify/Update/Print/Download Invoice — no
                    Cancel, no Send Quote, no Send Invoice. */}
                {!isClient && (
                  <Button onClick={handleCancelEvent} loading={isCancelingEvent}>
                    Cancel Event
                  </Button>
                )}
                {!isClient && (
                  <Button
                    onClick={async () => {
                      if (!eventId) return;
                      setButtonLoading("quote");
                      try {
                        const data = await fetchEmailTemplate(
                          String(eventId),
                          "SEND QUOTE-CONFIRMED",
                        );
                        setModalTemplate(data?.email ?? null);
                        setModalCompanies(data?.companies ?? null);
                        setSendMode("quote");
                        setShowModal(true);
                      } catch {
                        toast.error("Failed to load email template");
                      } finally {
                        setButtonLoading(null);
                      }
                    }}
                    loading={buttonLoading === "quote"}
                  >
                    Send Quote
                  </Button>
                )}
                <Button
                  loading={isDownloadingInvoice}
                  onClick={handleDownloadInvoice}
                >
                  Download Invoice
                </Button>
                {!isClient && (
                  <Button
                    onClick={async () => {
                      if (!eventId) return;
                      setButtonLoading("invoice");
                      try {
                        const data = await fetchEmailTemplate(
                          String(eventId),
                          "SEND INVOICE-OPEN",
                        );
                        setModalTemplate(data?.email ?? null);
                        setModalCompanies(data?.companies ?? null);
                        setSendMode("invoice");
                        setShowModal(true);
                      } catch {
                        toast.error("Failed to load email template");
                      } finally {
                        setButtonLoading(null);
                      }
                    }}
                    loading={buttonLoading === "invoice"}
                  >
                    Send Invoice
                  </Button>
                )}
                {/* Additional top-level confirmed send invoice + refund buttons —
                    Admin only (see useRole import above) */}
                {isAdmin && (
                  <Button
                    onClick={() => setShowRefundModal(true)}
                  >
                    Refund
                  </Button>
                )}
                {/* Drawer trigger (Package Summary / Rig List / Payment Summary) —
                    everyone but Client, matching Laravel's sidebar panel;
                    the Add Payment form inside stays Admin-only via
                    canAddPayment on the drawer itself. */}
                {!isClient && (
                  <Button onClick={() => setShowDrawer(true)}>
                    <MoreVertical size={14} />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="max-w-100">
          <Select
            value={eventId || undefined}
            className="w-[430px]"
            placeholder="Select event"
            options={eventsOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(String(input).toLowerCase()) ||
              String(option?.value ?? "")
                .toLowerCase()
                .includes(String(input).toLowerCase())
            }
            onChange={(value) => {
              setEventId(String(value ?? ""));
              setIsModifyMode(false);
            }}
            allowClear
          />
        </div>
        <div className="relative">
          {isLoading && (
            <Spin
              style={{
                position: "absolute",
                left: "50%",
                top: "10%",
                zIndex: 999,
              }}
              size="large"
            />
          )}
          <div
            className={`bg-white rounded-xl p-5 ${isLoading ? "opacity-60" : ""}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN — order/labels match Laravel @notmobile desktop form */}
              <div className="space-y-4">
                <Input
                  name="first_name"
                  label="Client name"
                  placeholder="Enter client name"
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="phone_number"
                    label="Phone number"
                    type="number"
                    placeholder="Enter phone number"
                    value={formik.values.phone_number}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="djName"
                    label="DJ name"
                    placeholder="Enter DJ name"
                    value={formik.values.djName}
                    onChange={formik.handleChange}
                    disabled
                  />
                  <Input
                    name="videography"
                    label="Videography"
                    placeholder="Enter videographer name"
                    value={formik.values.videography}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="caterer"
                    label="Caterer"
                    placeholder="Enter caterer name"
                    value={formik.values.caterer}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="decor"
                    label="Decor"
                    placeholder="Enter decor company"
                    value={formik.values.decor}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <Input
                  name="name"
                  label="Name/s (How should the DJ address you on the microphone?)"
                  placeholder="Enter name/s"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <div>
                  <label className="mb-1 block text-xs">
                    Entrance Song/Style (eg Guests upstanding, napkin waves, any dhol players etc)
                  </label>
                  <textarea
                    name="entranceSong"
                    className="min-h-20 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter entrance song/style"
                    value={formik.values.entranceSong}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">
                    Cake Cut Song/Who to feed? (Leave song name blank if you wish for DJ to select)
                  </label>
                  <textarea
                    name="cakeCutSong"
                    className="min-h-20 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter cake cut song"
                    value={formik.values.cakeCutSong}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <Input
                  name="firstDance"
                  label="First dance"
                  placeholder="Enter first dance song"
                  value={formik.values.firstDance}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <div>
                  <label className="mb-1 block text-xs">Do&apos;s</label>
                  <textarea
                    name="dos"
                    className="min-h-20 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter preferences/do's"
                    value={formik.values.dos}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    name="date"
                    label="Date"
                    type="date"
                    placeholder="Select date"
                    value={formik.values.date}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="start_time"
                    label="Start Time"
                    type="text"
                    placeholder="e.g. 7am, 7:30pm or 19:30"
                    value={formik.values.start_time}
                    onChange={formik.handleChange}
                    onBlur={(e) => {
                      const parsed = parseTimeTo24(e.target.value);
                      formik.setFieldValue("start_time", parsed);
                    }}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="end_time"
                    label="End Time"
                    type="text"
                    placeholder="e.g. 7pm, 7:30pm or 19:30"
                    value={formik.values.end_time}
                    onChange={formik.handleChange}
                    onBlur={(e) => {
                      const parsed = parseTimeTo24(e.target.value);
                      formik.setFieldValue("end_time", parsed);
                    }}
                    disabled={!isModifyMode}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="venue"
                    label="Venue"
                    placeholder="Venue"
                    value={formik.values.venue}
                    onChange={formik.handleChange}
                    disabled
                  />
                  <Input
                    name="accessDate"
                    label="Access Date/Time"
                    placeholder="Enter access info"
                    value={formik.values.accessDate}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="eventDateContact"
                    label="Event day contact"
                    placeholder="Enter event day contact"
                    value={formik.values.eventDateContact}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="noOfGuests"
                    label="No of guests"
                    type="number"
                    placeholder="Enter number of guests"
                    value={formik.values.noOfGuests}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="depositAmount"
                    label="Deposit Amount"
                    type="number"
                    placeholder="Enter deposit amount"
                    value={formik.values.depositAmount}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="createdBy"
                    label="Created by"
                    placeholder="Enter creator name"
                    value={formik.values.createdBy}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">
                    Brief Itinerary/Playlist and Notes
                  </label>
                  <textarea
                    name="briefItinerary"
                    className="min-h-[280px] w-full resize-y rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter brief itinerary, playlist, and notes"
                    value={formik.values.briefItinerary}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="stagTuneAndDestination"
                    label="Stag Tune/Destination"
                    placeholder="Enter stag tune/destination"
                    value={formik.values.stagTuneAndDestination}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="henTuneAndDestination"
                    label="Hen Tune/Destination"
                    placeholder="Enter hen tune/destination"
                    value={formik.values.henTuneAndDestination}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Dont&apos;s</label>
                  <textarea
                    name="donts"
                    className="min-h-20 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter don'ts"
                    value={formik.values.donts}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 py-4">
          <Button
            htmlType="button"
            type="primary"
            onClick={() => setShowNotes((v) => !v)}
            className="px-3 py-1"
          >
            {showNotes ? "Hide Notes" : "Show Notes"}
          </Button>
          {/* Line-item payment history (Date/Amount/Reference) is Admin/Staff
              only — the legacy Laravel CRM's Client view only ever shows an
              aggregate total + outstanding figure, never per-payment records. */}
          {!isClient && (
            <Button
              htmlType="button"
              type="primary"
              onClick={() => setShowPayments((v) => !v)}
              className="px-3 py-1"
            >
              {showPayments ? "Hide Payments" : "Show Payments"}
            </Button>
          )}
        </div>
        {/* Client never gets a Payments box (see !isClient above), so the
            grid collapses to 1 column for them instead of leaving an empty,
            dead second column at half width. */}
        <div className={`grid ${isClient ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
          <div
            className={`overflow-hidden rounded-xl bg-white border border-gray-200 transition-all duration-300 ease-in-out ${
              showNotes
                ? "max-h-[800px] opacity-100 p-4"
                : "max-h-0 opacity-0 p-0"
            }`}
            aria-hidden={!showNotes}
          >
            <div className="space-y-3">
                  {showNotes && (
                <>
                  {eventNotes.length === 0 ? (
                    <div className="text-sm text-gray-500">No notes found.</div>
                  ) : (
                    eventNotes.map((n: ConfirmEventNote) => (
                      <div
                        key={n.id ?? n.notes ?? Math.random()}
                        className="rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          {n.notes ?? "Note"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created on {n.created_at ? dayjs(n.created_at).format("DD-MM-YYYY HH:mm") : "—"}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {!isClient && <div
            className={`overflow-hidden bg-white rounded-xl border border-gray-200 transition-all duration-300 ease-in-out ${
              showPayments
                ? "max-h-[800px] opacity-100 p-4"
                : "max-h-0 opacity-0 p-0"
            }`}
            aria-hidden={!showPayments}
          >
            {showPayments && (
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                      {payments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-sm text-gray-500"
                        >
                          No payments found.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p: ConfirmEventPayment) => (
                        <tr key={p.id ?? Math.random()}>
                          <td className="px-4 py-2">
                            {p.date ? dayjs(p.date).format("DD/MM/YYYY") : "-"}
                          </td>
                          <td className="px-4 py-2">£{Number(p.amount ?? 0)}</td>
                          <td className="px-4 py-2">-</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>}
        </div>
      </form>
      {showModal && (
        <SendBrochureModal
          open={showModal}
          eventId={eventId}
          sendMode={sendMode}
          template={modalTemplate}
          companies={modalCompanies}
          onCancel={() => setShowModal(false)}
        />
      )}
      {/* mt-4 on a wrapper div (not the Collapse's own className prop, which
          AntD doesn't reliably forward to a plain margin on its root) — the
          Collapse sits outside the form above, so it doesn't get the form's
          `space-y-4`; without this the accordion sits flush against the
          payments/notes box whenever showPayments/showNotes is open. */}
      <div className="mt-4">
        <Collapse
          bordered={false}
          expandIconPlacement="end"
          expandIcon={({ isActive }) => (
            <ChevronDown
              size={14}
              className={`transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
            />
          )}
          style={{ background: "transparent" }}
          items={getItems(panelStyle)}
        />
      </div>
      <EventPaymentDrawer
        eventId={eventId}
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        canAddPayment={isAdmin}
      />

        {/* Send Invoice Modal */}
        {showInvoiceModal && (
          <SendInvoiceModal
            open={showInvoiceModal}
            onCancel={() => setShowInvoiceModal(false)}
            eventId={eventId}
            template={invoiceTemplate}
            onSend={(subject, body) => {
              setButtonLoading("sending");
              sendInvoiceMutation(
                {
                  id: eventId,
                  payload: {
                    subject,
                    body,
                    company_name_id: selectedEventData?.data?.names_id
                      ? Number(selectedEventData.data.names_id)
                      : undefined,
                    email: selectedEventData?.data?.users_events_user_idTousers?.email,
                  },
                },
                {
                  onSuccess: () => {
                    setShowInvoiceModal(false);
                    setInvoiceTemplate(null);
                    setButtonLoading(null);
                  },
                  onError: () => {
                    setButtonLoading(null);
                  },
                },
              );
            }}
            isSending={isSendingInvoice}
          />
        )}

        {/* Refund Modal */}
        {showRefundModal && (
          <RefundModal
            open={showRefundModal}
            onCancel={() => {
              setShowRefundModal(false);
              setRefundAmount("");
            }}
            onRefund={(amount) => {
              refundMutation(
                {
                  id: eventId,
                  payload: { refund_amount: Number(amount) },
                },
                {
                  onSuccess: () => {
                    // ensure fresh event data is fetched after refund
                    queryClient.invalidateQueries({ queryKey: ["confirm-event", eventId] });
                    setShowRefundModal(false);
                    setRefundAmount("");
                  },
                },
              );
            }}
            isProcessing={isProcessingRefund}
            refundAmount={refundAmount}
            setRefundAmount={setRefundAmount}
            eventTotal={
              Number(selectedEventData?.data?.total_cost_for_equipment) ||
              (Array.isArray(selectedEventData?.data?.event_packages)
                ? (selectedEventData?.data?.event_packages || []).reduce(
                    (s: number, p: ConfirmEventPackage) => s + Number(p.total_price || p.sell_price || 0),
                    0,
                  )
                : 0)
            }
            paidAmount={adjustedPaidAmount}
          />
        )}
    </div>
  );
};

export default ConfirmedEventsPage;
