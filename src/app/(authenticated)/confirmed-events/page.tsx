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
import { Collapse, CollapseProps, Select, Spin } from "antd";
import dayjs from "dayjs";
import { useFormik } from "formik";
import {
  ChevronDown,
  FileText,
  FolderOpen,
  MoreVertical,
  SquareCheckBig,
} from "lucide-react";
import Link from "next/link";
import { CSSProperties, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Files from "./Files";
import { ConfirmEventData, EventsDropdownItem } from "@/src/types/types";
import SendBrochureModal from "../open-enquiry/SendBrochure";
import { toast } from "react-toastify";
import { fetchEmailTemplate } from "@/src/api/enquiry";
import Contracts from "./Contracts";
import Todos from "./_components/Todos";

const ConfirmedEventsPage = () => {
  const [eventId, setEventId] = useState("");
  const [sendMode, setSendMode] = useState<"invoice" | "quote">("quote");
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
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
    djName: data?.dj_name || "",
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
    everyDayContactName: "", // These are concatenated in event_date_contact
    everyDayContactNumber: "",
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

            // DJ & Vendors
            dj_name: values.djName || null,
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

            // Contact String
            event_date_contact:
              `${values.everyDayContactName} ${values.everyDayContactNumber}`.trim() ||
              null,
          },
          id: eventId,
        },
        {
          onSuccess: () => {
            setIsModifyMode(false);
            toast.success("Event updated successfully");
          },
        },
      );
    },
  });

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
      children: <Contracts data={selectedEventData?.data} />,
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

  const handleCancelEvent = () => {
    cancelEventMutation({ id: eventId });
  };

  const handleDownloadInvoice = () => {
    downloadInvoiceMutation({ id: eventId });
  };

  return (
    <div>
      <form className="mt-4 space-y-4" onSubmit={formik.handleSubmit}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="shrink-0">
              <BackButton />
            </Link>
            <h2 className="themeH1">Confirmed Events</h2>
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
                    } catch (err) {
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
                    } catch (err) {
                      toast.error("Failed to load email template");
                    } finally {
                      setButtonLoading(null);
                    }
                  }}
                  loading={buttonLoading === "invoice"}
                >
                  Send Invoice
                </Button>
                <Button>
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
              <div className="space-y-4">
                <Input
                  name="first_name"
                  label="Client Name"
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
                    label="Phone Number"
                    type="number"
                    placeholder="Enter phone number"
                    value={formik.values.phone_number}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="djName"
                    label="Dj Name"
                    placeholder="Enter DJ name"
                    value={formik.values.djName}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
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
                  label="Couple Name"
                  placeholder="Enter couple name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <Input
                  name="entranceSong"
                  label="Entrance Song"
                  placeholder="Enter entrance song"
                  value={formik.values.entranceSong}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <Input
                  name="cakeCutSong"
                  label="Cake cut song"
                  placeholder="Enter cake cut song"
                  value={formik.values.cakeCutSong}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <Input
                  name="firstDance"
                  label="First Dance"
                  placeholder="Enter first dance song"
                  value={formik.values.firstDance}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <Input
                  name="dos"
                  label="Do's"
                  placeholder="Enter preferences/do's"
                  value={formik.values.dos}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <Input
                  name="stagTuneAndDestination"
                  label="Stag Tune and destination"
                  placeholder="Enter stag tune and destination"
                  value={formik.values.stagTuneAndDestination}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
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
                    type="time"
                    placeholder="Select start time"
                    value={formik.values.start_time}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="end_time"
                    label="End Time"
                    type="time"
                    placeholder="Select end time"
                    value={formik.values.end_time}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    name="accessDate"
                    label="Access Time/Date"
                    containerClassName="col-span-1"
                    placeholder="Enter access info"
                    value={formik.values.accessDate}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="everyDayContactName"
                    label="Every Day Contact Name"
                    containerClassName="col-span-2"
                    placeholder="Enter contact name"
                    value={formik.values.everyDayContactName}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    name="everyDayContactNumber"
                    label="Every Day Contact Number"
                    type="tel"
                    containerClassName="col-span-1"
                    placeholder="Enter contact number"
                    value={formik.values.everyDayContactNumber}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="noOfGuests"
                    label="No of Guests"
                    type="number"
                    containerClassName="col-span-2"
                    placeholder="Enter number of guests"
                    value={formik.values.noOfGuests}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    name="depositAmount"
                    label="Deposit Amount"
                    containerClassName="col-span-1"
                    type="number"
                    placeholder="Enter deposit amount"
                    value={formik.values.depositAmount}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                  <Input
                    name="createdBy"
                    label="Created By"
                    containerClassName="col-span-2"
                    placeholder="Enter creator name"
                    value={formik.values.createdBy}
                    onChange={formik.handleChange}
                    disabled={true} // Usually non-editable
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">
                    Brief Itinerary/Playlist and Notes
                  </label>
                  <textarea
                    name="briefItinerary"
                    className="h-[265px] w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                    placeholder="Enter brief itinerary, playlist, and notes"
                    style={{ resize: "none" }}
                    value={formik.values.briefItinerary}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                  />
                </div>
                <Input
                  name="donts"
                  label="Don'ts"
                  placeholder="Enter don'ts"
                  value={formik.values.donts}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
                <Input
                  name="henTuneAndDestination"
                  label="Hen Tune and Destination"
                  placeholder="Enter hen tune and destination"
                  value={formik.values.henTuneAndDestination}
                  onChange={formik.handleChange}
                  disabled={!isModifyMode}
                />
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
                    eventNotes.map((n: any) => (
                      <div
                        key={n.id ?? n.note ?? Math.random()}
                        className="rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          {n.note ?? n.notes ?? "Note"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created on{" "}
                          {n.created_at
                            ? dayjs(n.created_at).format("DD-MM-YYYY HH:mm")
                            : "—"}
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
                      payments.map((p: any) => (
                        <tr key={p.id ?? p.payment_reference ?? Math.random()}>
                          <td className="px-4 py-2">
                            {p.payment_date
                              ? dayjs(p.payment_date).format("DD/MM/YYYY")
                              : p.date
                                ? dayjs(p.date).format("DD/MM/YYYY")
                                : "-"}
                          </td>
                          <td className="px-4 py-2">
                            £{p.amount ?? p.payment_amount ?? p.payment ?? 0}
                          </td>
                          <td className="px-4 py-2">
                            {p.payment_reference ?? p.reference ?? "-"}
                          </td>
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
    </div>
  );
};

export default ConfirmedEventsPage;
