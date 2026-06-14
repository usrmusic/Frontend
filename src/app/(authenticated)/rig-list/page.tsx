"use client";
import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import { Printer, Save } from "lucide-react";
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl overflow-hidden">
          <div className="p-4 bg-primary">
            <Select
              value={eventId ? eventId : undefined}
              className="w-[430px]"
              placeholder="Select event"
              options={eventsptions}
              onChange={(value) => setEventId(value || "")}
              allowClear
            />
          </div>
          <div className="bg-white px-5 py-4">
            <div className="text-sm space-y-4">
              {isLoading ? (
                <Spin />
              ) : (
                <>
                  {rigNotesData?.packages?.length > 0 ? (
                    <div className="space-y-4">
                      {rigNotesData?.packages?.map((pkg: any, idx: number) => (
                        <div key={idx}>
                          <p>{pkg.equipment?.name}</p>
                          {pkg.equipment?.rig_notes && (
                            <div
                              className="text-sm pl-2 py-1"
                              dangerouslySetInnerHTML={{ __html: pkg.equipment.rig_notes }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>No rig notes available. </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden bg-white">
          <div className="bg-primary h-20 flex items-center px-4 text-white">
            <p>Event Notes</p>
          </div>
          <textarea
            name="notes"
            id="notes"
            placeholder="Add Notes"
            className="w-full resize-none p-5"
            rows={18}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
          <div className="p-4 text-sm">
            <p>Venue: {rigNotesData?.event?.venues?.venue}</p>
            <p>Date: {rigNotesData?.event?.date}</p>
            <p>
              Time: {dayjs(rigNotesData?.event?.start_time).format("HH:mm")} -{" "}
              {dayjs(rigNotesData?.event?.end_time).format("HH:mm")}
            </p>
            <p>
              Access Times:{" "}
              {rigNotesData?.event?.access_time
                ? dayjs(rigNotesData?.event?.access_time).format("HH:mm")
                : "N/A"}
            </p>
            <p>Dj: {rigNotesData?.event?.users_events_dj_idTousers?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
