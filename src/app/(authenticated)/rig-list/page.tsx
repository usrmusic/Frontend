"use client";
import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import { Printer, Save, SquareCheckBig } from "lucide-react";
import Link from "next/link";
import { Select, Spin } from "antd";
import { useRigListEventsDropdown } from "@/src/api/dropdown";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useGetRigList, useSaveRigNotes } from "@/src/api/riglist";
import { toast } from "react-toastify";
import useRole from "@/src/hooks/useRole";
import AccessDenied from "@/src/components/common/AccessDenied";
import Card from "@/src/components/Card";

const Page = () => {
  const { isClient } = useRole();
  const [eventId, setEventId] = useState("");
  const [note, setNote] = useState("");
  const { data: eventsDropdown } = useRigListEventsDropdown();
  const { data: rigNotesData, isLoading } = useGetRigList(eventId);
  const { mutate: saveRigNotesMutation } = useSaveRigNotes();

  useEffect(() => {
    if (rigNotesData?.event?.rigList_event_notes) {
      setNote(rigNotesData.event.rigList_event_notes);
    } else {
      setNote("");
    }
  }, [rigNotesData]);

  const eventsptions = eventsDropdown?.data.map((item: any) => ({
    label: `${dayjs(item.date).format("DD/MM/YYYY")} - ${item.venues?.venue} (${item.users_events_user_idTousers?.name})`,
    value: String(item.id),
  }));

  const handleSave = () => {
    saveRigNotesMutation(
      { id: eventId, note },
      {
        onSuccess: () => toast.success("Notes Saved Successfully"),
      },
    );
  };

  const event = rigNotesData?.event;

  // Rig list is never a Client-facing feature — matches the legacy Laravel
  // CRM, which hides its rig-list widget specifically for role_id 4 on top
  // of the "rig list" permission gate.
  if (isClient) {
    return (
      <AccessDenied message="Rig list isn't available for client accounts." />
    );
  }

  const formatTime = (t?: string) => {
    if (!t) return "";
    if (t.includes("T")) return dayjs(t).format("HH:mm");
    return dayjs(`2000-01-01T${t}`).format("HH:mm");
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="shrink-0">
            <BackButton />
          </Link>
          <h2 className="themeH1">Rig List</h2>
        </div>
        <div className="flex gap-3">
          <Button
            type="primary"
            icon={<Save size={14} />}
            disabled={!eventId}
            onClick={handleSave}
          >
            Save
          </Button>
          <Button icon={<Printer size={14} />}>Print</Button>
        </div>
      </div>

      {/* Event selector — plain white filter bar, matching Completed Events'
          filter row rather than a colored primary bar. */}
      <div className="grid grid-cols-4 gap-2">
        <Select
          value={eventId ? eventId : undefined}
          className="w-full col-span-2 bg-white rounded-lg"
          placeholder="Select event"
          options={eventsptions}
          onChange={(value) => setEventId(value || "")}
          allowClear
        />
      </div>

      {/* Plain section title under the dropdown, matching the confirmed-events
          drawer's "Rig List" label rather than a second colored header bar. */}
      {/* <p className="text-sm font-semibold text-gray-900">Rig List</p> */}

      {/* Two independent cards instead of one card split by a divider —
          gap-4 matches the app's standard two-column card spacing (see
          dashboard's grid grid-cols-12 gap-4). */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT — Rig list */}
        <Card variant="white" className="rounded-2xl shadow-sm overflow-hidden p-5 min-h-[200px]">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : rigNotesData?.packages?.filter((pkg: any) => pkg.rig_notes || pkg.equipment?.rig_notes).length > 0 ? (
              <div className="space-y-4">
                {rigNotesData.packages
                  .filter((pkg: any) => pkg.rig_notes || pkg.equipment?.rig_notes)
                  .map((pkg: any, idx: number) => {
                    // Title is always the equipment name — the notes text
                    // (event-specific rig_notes, or equipment's own default)
                    // is content underneath it, never a stand-in title. This
                    // used to swap in the first line of custom notes as the
                    // title, which lost the actual item name whenever staff
                    // added their own rig notes.
                    const title = pkg.equipment?.name || "Equipment";
                    // Matches Laravel exactly (complete_events.js's rig-list
                    // render loop): an equipment item with NO rig_notes set,
                    // neither on this event nor on the catalog record, is
                    // omitted from the Rig List entirely — not just its
                    // sub-checklist. A quick-added custom item with no notes
                    // field simply won't appear until it's given rig_notes.
                    const rawNotes = pkg.rig_notes || pkg.equipment?.rig_notes || "";
                    // replace <br> tags with newlines before splitting so they don't render as text
                    const items = rawNotes
                      .replace(/<br\s*\/?>/gi, "\n")
                      .replace(/\r\n|\n|\r/g, "\n")
                      .split("\n")
                      .map((l: string) => l.trim())
                      .filter(Boolean);

                    return (
                      <div key={idx} className="space-y-1.5 pb-3 last:border-0 last:pb-0">
                        {/* Section title — same style as enquiry page rig list */}
                        <div className="flex items-center gap-2">
                          <SquareCheckBig size={14} className="text-primary shrink-0" />
                          {/* Equipment names/notes are stored with inline HTML
                              (e.g. "<b>SCREEN...</b>", "&amp;") from the old
                              Laravel data — rendering as plain text left the
                              raw tags/entities visible instead of formatted
                              text. Same fix already applied to rig_notes in
                              EventPaymentDrawer. */}
                          <p
                            className="font-semibold text-sm text-gray-900"
                            dangerouslySetInnerHTML={{ __html: title }}
                          />
                        </div>
                        {/* Checkbox items */}
                        {items.length > 0 && (
                          <ul className="pl-5 space-y-1.5 mt-1">
                            {items.map((line: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  className="size-3.5 shrink-0"
                                  style={{ accentColor: "#719984" }}
                                />
                                <span dangerouslySetInnerHTML={{ __html: line }} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No rig notes available.</p>
            )}
        </Card>

        {/* RIGHT — Event notes */}
        <Card variant="white" className="rounded-2xl shadow-sm overflow-hidden p-0 flex flex-col">
            {/* Event info block — shown at top when event is loaded */}
            {event && (
              <div className="px-5 pt-5 shrink-0">
                <div className="rounded-xl bg-secondary-200/50 border border-secondary-200 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {event.venues?.venue && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Venue</p>
                      <p className="font-medium text-gray-900 text-sm">{event.venues.venue}</p>
                    </div>
                  )}
                  {event.date && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date</p>
                      <p className="font-medium text-gray-900 text-sm">{dayjs(event.date).format("DD/MM/YYYY")}</p>
                    </div>
                  )}
                  {(event.start_time || event.end_time) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Time</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {formatTime(event.start_time)} – {formatTime(event.end_time)}
                      </p>
                    </div>
                  )}
                  {event.access_time && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Access Time</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {event.access_time !== "N/A" ? formatTime(event.access_time) : "N/A"}
                      </p>
                    </div>
                  )}
                  {event.users_events_dj_idTousers?.name && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">DJ</p>
                      <p className="font-medium text-gray-900 text-sm">{event.users_events_dj_idTousers.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes textarea — inline style overrides the global textarea{background} rule */}
            <textarea
              name="notes"
              id="notes"
              placeholder="Add Notes"
              className="flex-1 w-full resize-none px-5 py-4 outline-none text-sm text-gray-700 placeholder:text-gray-400 min-h-[200px]"
              style={{ backgroundColor: "#fff" }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
        </Card>

      </div>
    </div>
  );
};

export default Page;
