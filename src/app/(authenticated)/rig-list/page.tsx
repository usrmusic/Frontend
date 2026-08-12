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

const Page = () => {
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT — Rig list (kept narrower than the notes panel for now) */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden">
          {/* Header — matched height with right panel */}
          <div className="bg-primary h-[72px] flex items-center px-4">
            <Select
              value={eventId ? eventId : undefined}
              className="w-full"
              placeholder="Select event"
              options={eventsptions}
              onChange={(value) => setEventId(value || "")}
              allowClear
            />
          </div>

          <div className="bg-white px-5 py-4 min-h-[200px]">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : rigNotesData?.packages?.filter((pkg: any) => pkg.rig_notes || pkg.equipment?.rig_notes).length > 0 ? (
              <div className="space-y-4">
                {rigNotesData.packages
                  .filter((pkg: any) => pkg.rig_notes || pkg.equipment?.rig_notes)
                  .map((pkg: any, idx: number) => {
                    const rawNotes = pkg.rig_notes || pkg.equipment?.rig_notes || "";
                    // replace <br> tags with newlines before splitting so they don't render as text
                    const lines = rawNotes
                      .replace(/<br\s*\/?>/gi, "\n")
                      .replace(/\r\n|\n|\r/g, "\n")
                      .split("\n")
                      .map((l: string) => l.trim())
                      .filter(Boolean);
                    const title = pkg.rig_notes ? lines[0] : (pkg.equipment?.name || "Equipment");
                    const items = pkg.rig_notes ? lines.slice(1) : lines;

                    return (
                      <div key={idx} className="space-y-1.5 pb-3 last:border-0 last:pb-0">
                        {/* Section title — same style as enquiry page rig list */}
                        <div className="flex items-center gap-2">
                          <SquareCheckBig size={14} className="text-primary shrink-0" />
                          <p className="font-semibold text-sm text-gray-900">{title}</p>
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
                                <span>{line}</span>
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
          </div>
        </div>

        {/* RIGHT — Event notes */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden bg-white flex flex-col">
          {/* Header — matched height with left panel */}
          <div className="bg-primary h-[72px] flex items-center px-5 text-white shrink-0">
            <p className="font-medium">Event Notes</p>
          </div>

          {/* Event info block — shown at top when event is loaded */}
          {event && (
            <div className="px-5 pt-4 shrink-0">
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
        </div>

      </div>
    </div>
  );
};

export default Page;
