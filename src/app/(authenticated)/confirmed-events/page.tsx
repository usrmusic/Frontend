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
import { CSSProperties, useState } from "react";
import Files from "./Files";
import { ConfirmEventData, EventsDropdownItem } from "@/src/types/types";
import SendBrochureModal from "../open-enquiry/SendBrochure";

const ConfirmedEventsPage = () => {
  const [eventId, setEventId] = useState("");
  const [sendMode, setSendMode] = useState<"invoice" | "quote">("quote");
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const { mutate: updateEventMutation, isPending } = useUpdateConfirmEvent();
  const { mutate: downloadInvoiceMutation, isPending: isDownloadingInvoice } =
    useDownloadInvoice();
  const { mutate: cancelEventMutation, isPending: isCancelingEvent } =
    useCancelEvent();
  const { data: eventsDropdown } = useRigListEventsDropdown();
  const { data: selectedEventData, isLoading } = useGetConfirmEvent(eventId);

  const eventsptions = (
    eventsDropdown?.data as EventsDropdownItem[] | undefined
  )?.map((item) => ({
    label: `${dayjs(item.date).format("DD/MM/YYYY")} - ${item.venues?.venue} (${item.users_events_user_idTousers?.name})`,
    value: item.id,
  }));

  // Form fields with initial values.
  const getInitialValues = (data?: ConfirmEventData) => ({
    first_name: data?.users_events_user_idTousers?.name || "",
    email: data?.users_events_user_idTousers?.email || "",
    phone_number: data?.users_events_user_idTousers?.contact_number || "",
    djName: data?.dj_name || "",
    videography: data?.videography || "",
    caterer: data?.caterer || "",
    decor: data?.decor || "",
    name: data?.name || "",
    entranceSong: data?.entrance_song || "",
    cakeCutSong: data?.cake_cut_song || "",
    firstDance: data?.first_dance || "",
    dos: data?.do || "",
    stagTuneAndDestination: data?.stag_tune_and_destination || "",
    date: data?.date ? dayjs(data?.date).format("YYYY-MM-DD") : "",
    start_time: data?.start_time ? dayjs(data.start_time).format("HH:mm") : "",
    end_time: data?.end_time ? dayjs(data.end_time).format("HH:mm") : "",
    accessDate: data?.access_date
      ? dayjs(data?.access_date).format("YYYY-MM-DD")
      : "",
    everyDayContactName: data?.everyday_contact_name || "",
    everyDayContactNumber: data?.everyday_contact_number || "",
    noOfGuests: data?.no_of_guests || "",
    depositAmount: data?.deposit_amount || "",
    createdBy: data?.created_by || "",
    briefItinerary: data?.playlist_request || "",
    donts: data?.dont || "",
    henTuneAndDestination: data?.hen_tune_and_destination || "",
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialValues(
      selectedEventData?.data as ConfirmEventData | undefined,
    ),
    onSubmit: (values) => {
      updateEventMutation({
        values: {
          first_name: values.first_name,
          email: values.email,
          phone_number: values.phone_number,
          couple_name: "asdf",
          date: dayjs(values.date).format("DD-MM-YYYY"),
          start_time: values.start_time,
          end_time: values.end_time,
          videography: values.videography,
        },
        id: eventId,
      });
    },
  });

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
      children: <p>{"text"}</p>,
      style: panelStyle,
    },
    {
      key: "2",
      label: (
        <div className="flex items-center gap-1">
          <FolderOpen size={14} />
          <span>Files</span>
          <span>{`(${selectedEventData?.data.file_uploads.length ?? 0})`}</span>
        </div>
      ),
      children: <Files dataSource={selectedEventData?.data?.file_uploads} />,
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
      children: <p>No Records Found</p>,
      style: panelStyle,
    },
  ];

  const handleCancelEvent = () => {
    cancelEventMutation({ id: eventId });
  };

  const handleDownloadInvoice = () => {
    downloadInvoiceMutation(
      { id: eventId },
      {
        onSuccess: (data) => {
          console.log(data);
        },
      },
    );
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
                <Button>Print</Button>
                <Button onClick={handleCancelEvent} loading={isCancelingEvent}>
                  Cancel Event
                </Button>
                <Button
                  onClick={() => {
                    setSendMode("quote");
                    setShowModal(true);
                  }}
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
                  onClick={() => {
                    setSendMode("invoice");
                    setShowModal(true);
                  }}
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
            value={eventId ? eventId : undefined}
            className="w-[430px]"
            placeholder="Select event"
            options={eventsptions}
            onChange={(value) => {
              setEventId(value ?? "");
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
                  required
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
                    required
                  />
                  <Input
                    name="phone_number"
                    label="Phone Number"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formik.values.phone_number}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                    required
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
                  label="Name"
                  placeholder="Enter name"
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
                    required
                  />
                  <Input
                    name="start_time"
                    label="Start Time"
                    type="time"
                    placeholder="Select start time"
                    value={formik.values.start_time}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                    required
                  />
                  <Input
                    name="end_time"
                    label="End Time"
                    type="time"
                    placeholder="Select end time"
                    value={formik.values.end_time}
                    onChange={formik.handleChange}
                    disabled={!isModifyMode}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    name="accessDate"
                    label="Access Date"
                    containerClassName="col-span-1"
                    type="date"
                    placeholder="Enter access date"
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
                    disabled={!isModifyMode}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">
                    Brief Itinerary/Playlist and Notes
                  </label>
                  <textarea
                    name="briefItinerary"
                    className="h-[265px] w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
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
        <div className="text-end">
          <Button
            type="text"
            htmlType="button"
            showShadow={false}
            onClick={() => setShowNotes((v) => !v)}
          >
            {showNotes ? "Hide Notes" : "Show Notes"}
          </Button>
          <Button
            type="text"
            htmlType="button"
            showShadow={false}
            onClick={() => setShowPayments((v) => !v)}
          >
            {showPayments ? "Hide Payments" : "Show Payments"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          {showNotes ? (
            <div className="overflow-hidden rounded-xl bg-white border border-gray-200 p-4">
              <div className="space-y-3">
                {eventNotes.length === 0 ? (
                  <div className="text-sm text-gray-500">No notes found.</div>
                ) : (
                  eventNotes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-gray-50 px-3 py-2">
                      <div className="text-sm font-medium text-gray-800">
                        {n.notes}
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
              </div>
            </div>
          ) : (
            <div></div>
          )}
          {showPayments && (
            <div className="overflow-hidden bg-white rounded-xl border border-gray-200">
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
                      Payment Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No payments found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2 text-gray-800">
                          {p.date ? dayjs(p.date).format("DD-MM-YYYY") : "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-800">{p.amount}</td>
                        <td className="px-4 py-2 text-gray-800">
                          {p.payment_method_id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
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
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ConfirmedEventsPage;
