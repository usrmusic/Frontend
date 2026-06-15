"use client";
import { useRigListEventsDropdown } from "@/src/api/dropdown";
import {
  useCancelEvent,
  useDownloadInvoice,
  useGetConfirmEvent,
  useUpdateConfirmEvent,
  useAddConfirmPayment,
} from "@/src/api/events";
import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { Collapse, CollapseProps, Select, Spin, DatePicker, Modal } from "antd";
import dayjs, { Dayjs } from "dayjs";
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
import { CSSProperties, useState, useEffect } from "react";
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

const ConfirmedEventsPage = () => {
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
  const { mutate: addPaymentMutation, isPending: isAddingPayment } =
    useAddConfirmPayment();
  const router = useRouter();
  const { mutate: sendInvoiceMutation, isPending: isSendingInvoice } =
    useSendConfirmInvoice();
  const { mutate: refundMutation, isPending: isProcessingRefund } =
    useRefundConfirmEvent();
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Dayjs | null>(dayjs());
  const [paymentMethodId, setPaymentMethodId] = useState<string | number>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [rigOpen, setRigOpen] = useState(false); // rig list toggle
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
  useEffect(() => {
    const s = searchParams?.get("search") ?? "";
    if (s && s !== eventId) {
      setEventId(String(s));
      setIsModifyMode(false);
    }
  }, [searchParams, searchParamsKey, eventId]);

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
                <Button onClick={handleCancelEvent} loading={isCancelingEvent}>
                  Cancel Event
                </Button>
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
                <Button
                  loading={isDownloadingInvoice}
                  onClick={handleDownloadInvoice}
                >
                  Download Invoice
                </Button>
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
                {/* Additional top-level confirmed send invoice + refund buttons */}
                <Button
                  onClick={() => setShowRefundModal(true)}
                >
                  Refund
                </Button>
                <Button onClick={() => setShowDrawer(true)}>
                  <MoreVertical size={14} />
                </Button>
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
                    className="h-24 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter entrance song/style"
                    style={{ resize: "none" }}
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
                    className="h-24 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter cake cut song"
                    style={{ resize: "none" }}
                    value={formik.values.cakeCutSong}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">First dance</label>
                  <textarea
                    name="firstDance"
                    className="h-24 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter first dance song"
                    style={{ resize: "none" }}
                    value={formik.values.firstDance}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Do&apos;s</label>
                  <textarea
                    name="dos"
                    className="h-24 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter preferences/do's"
                    style={{ resize: "none" }}
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
                    disabled
                  />
                  <Input
                    name="createdBy"
                    label="Created by"
                    placeholder="Enter creator name"
                    value={formik.values.createdBy}
                    onChange={formik.handleChange}
                    disabled
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">
                    Brief Itinerary/Playlist and Notes
                  </label>
                  <textarea
                    name="briefItinerary"
                    className="h-[180px] w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter brief itinerary, playlist, and notes"
                    style={{ resize: "none" }}
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
                    className="h-24 w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter don'ts"
                    style={{ resize: "none" }}
                    value={formik.values.donts}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mb-4">
          <Button
            htmlType="button"
            type="primary"
            onClick={() => setShowNotes((v) => !v)}
            className="px-3 py-1"
          >
            {showNotes ? "Hide Notes" : "Show Notes"}
          </Button>
          <Button
            htmlType="button"
            type="primary"
            onClick={() => setShowPayments((v) => !v)}
            className="px-3 py-1"
          >
            {showPayments ? "Hide Payments" : "Show Payments"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
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

          <div
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
          </div>
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
      {/* Slide-over drawer for payments */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none transition-all duration-300 ${showDrawer ? "opacity-100" : "opacity-0"}`}
          aria-hidden={!showDrawer}
        >
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${showDrawer ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
            onClick={() => setShowDrawer(false)}
          ></div>

          <aside
            className={`pointer-events-auto fixed right-0 top-0 h-full w-[420px] bg-white shadow-xl z-50 transform transition-transform duration-300 ${
              showDrawer ? "translate-x-0" : "translate-x-full"
            }`}
            role="dialog"
            aria-labelledby="drawer-title"
          >
            <div className="h-full flex flex-col bg-white">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gradient-to-r from-white to-slate-50">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Payment</p>
                  <h3 id="drawer-title" className="themeH1 text-lg mt-1">{selectedEventData?.data?.company?.name || "USR Music Ltd"}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedEventData?.data?.venues?.venue ?? ""}</p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)} 
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="Close drawer"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-6 space-y-6">
                  {/* Package Summary Section */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Package Summary</p>
                        <p className="font-semibold text-gray-900 mt-1">{selectedEventData?.data?.dj_package_name || "DJ Package"}</p>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors"
                        onClick={() => router.push(`/enquiry?select=${encodeURIComponent(String(eventId))}`)}
                        title="Edit enquiry details"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Equipment Names Only */}
                    <div className="space-y-2 pt-3 border-t border-slate-200">
                      {(selectedEventData?.data?.event_packages)?.length ? (
                        <div className="space-y-1">
                          {(selectedEventData?.data?.event_packages).map((p: ConfirmEventPackage) => (
                            <div key={p.id} className="flex items-start gap-2">
                              <SquareCheckBig size={14} className="text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-sm text-gray-900">{p.equipment?.name || p.package_name || p.name || "Item"}</p>
                                {p.notes && <p className="text-xs text-gray-500 italic mt-0.5">{p.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 py-2">No equipment items</p>
                      )}
                    </div>
                  </div>

                  {/* Rig List Section */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-white to-slate-50">
                      <h4 className="text-sm font-semibold text-gray-900">Rig List</h4>
                      <button
                        type="button"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label={rigOpen ? "Hide rig list" : "Show rig list"}
                        onClick={() => setRigOpen((s) => !s)}
                        title="Toggle rig list details"
                      >
                        <ChevronDown size={18} className={`transition-transform ${rigOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    
                    {/* Detailed Equipment List */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden`}
                      style={{
                        maxHeight: rigOpen ? "600px" : "0px",
                        opacity: rigOpen ? 1 : 0,
                      }}
                    >
                      <div className="p-4 space-y-3">
                        {(selectedEventData?.data?.event_packages)?.length ? (
                          (selectedEventData?.data?.event_packages).map((p: ConfirmEventPackage) => (
                            <div key={p.id} className="flex items-start justify-between bg-slate-50 rounded-lg p-3 border border-slate-100">
                              <div className="flex-1">
                                <div className="flex items-start gap-2">
                                  <SquareCheckBig size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold text-sm text-gray-900">{p.equipment?.name || p.package_name || p.name || "Item"}</p>
                                    {p.rig_notes && <p className="text-xs text-gray-600 mt-1 italic">{p.rig_notes}</p>}
                                    {p.quantity && p.quantity > 1 && <p className="text-xs text-gray-500 mt-1">Quantity: {p.quantity}</p>}
                                  </div>
                                </div>
                              </div>
                              {p.total_price && (
                                <div className="ml-3 text-sm font-semibold text-gray-900 flex-shrink-0 whitespace-nowrap">
                                  £{Number(p.total_price).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-4">No equipment items</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Form Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">Add Payment</h4>
                    
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!eventId) return toast.error("No event selected");
                        const dateIso = paymentDate ? paymentDate.toISOString() : new Date().toISOString();
                        addPaymentMutation({
                          id: eventId,
                          payload: {
                            payment_method_id: paymentMethodId ? Number(paymentMethodId) : undefined,
                            amount: Number(paymentAmount || 0),
                            date: dateIso,
                            notes: paymentNotes || undefined,
                          },
                        }, {
                          onSuccess: () => {
                            setShowDrawer(false);
                            setPaymentAmount("");
                            setPaymentDate(dayjs());
                            setPaymentMethodId("");
                            setPaymentNotes("");
                          },
                        });
                      }}
                      className="space-y-4"
                    >
                      {/* Amount Input */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Amount</label>
                        <input
                          name="amount"
                          type="number"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="0.00"
                          min={0}
                          required
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>

                      {/* Date & Payment Method */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date</label>
                          <DatePicker
                            placeholder="DD/MM/YYYY"
                            className="w-full text-xs"
                            format="DD-MM-YYYY"
                            value={paymentDate}
                            onChange={(val) => setPaymentDate(val)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Method</label>
                          <select
                            name="payment_method_id"
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            value={String(paymentMethodId ?? "")}
                            onChange={(e) => setPaymentMethodId(e.target.value)}
                          >
                            <option value="">Select method</option>
                            <option value="1">Cash</option>
                            <option value="2">Bank Transfer</option>
                            <option value="3">Card</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      {/* <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes</label>
                        <textarea
                          name="notes"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                          rows={3}
                          placeholder="Add payment notes..."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div> */}

                      {/* Submit Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button 
                          type="submit" 
                          className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={isAddingPayment}
                        >
                          {isAddingPayment ? "Saving..." : "Add Payment"}
                        </button>
                        {/* <button 
                          type="button" 
                          onClick={() => setShowDrawer(false)} 
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button> */}
                      </div>
                    </form>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-emerald-900">Payment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold text-gray-900">
                          £{(Number(selectedEventData?.data?.total_cost_for_equipment) || ((selectedEventData?.data?.event_packages || []).reduce((s: number, p: ConfirmEventPackage) => s + Number(p.total_price || p.sell_price || 0), 0))).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deposit Received:</span>
                        <span className="font-semibold text-gray-900">
                          £{adjustedPaidAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-emerald-200 flex justify-between">
                        <span className="font-semibold text-emerald-900">Outstanding:</span>
                        <span className="font-bold text-emerald-900">
                          £{(
                            (Number(selectedEventData?.data?.total_cost_for_equipment) || ((selectedEventData?.data?.event_packages || []).reduce((s: number, p: ConfirmEventPackage) => s + Number(p.total_price || p.sell_price || 0), 0))) - adjustedPaidAmount
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {/* <div className="space-y-3 border-t border-gray-200 pt-4">
                    <button
                      onClick={async () => {
                        setButtonLoading("send-invoice");
                        try {
                          const data = await fetchEmailTemplate(
                            String(eventId),
                            "SEND INVOICE-CONFIRMED",
                          );
                          setInvoiceTemplate({
                            subject: data?.email?.subject || `Invoice for event #${eventId}`,
                            body: data?.email?.body || `Please find your invoice attached.`,
                          });
                          setShowInvoiceModal(true);
                        } catch {
                          toast.error("Failed to load invoice template");
                        } finally {
                          setButtonLoading(null);
                        }
                      }}
                      disabled={isProcessingRefund || isSendingInvoice}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {buttonLoading === "send-invoice" ? "Loading..." : "Send Invoice"}
                    </button>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      disabled={isProcessingRefund || isSendingInvoice}
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessingRefund ? "Processing..." : "Refund"}
                    </button>
                  </div> */}
                </div>
              </div>
            </div>
          </aside>
        </div>

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
