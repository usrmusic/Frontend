"use client";
import Card from "@/src/components/Card";
import { Skeleton } from "antd";

type ActivityNote = {
  id?: number | string;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string | Date | null;
};

interface EventActivityProps {
  notes?: ActivityNote[];
  isLoading?: boolean;
}

export default function EventActivity({
  notes,
  isLoading,
}: EventActivityProps) {
  return (
    <Card variant="white" className="col-span-12 lg:col-span-3 flex flex-col shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Events Activity
          </p>
        </div>
      </div>
      <ul className="mb-4 no-scrollbar space-y-2 text-xs max-h-[280px] overflow-auto">
        {isLoading ? (
          <li className="flex items-center">
            <Skeleton active paragraph={false} />
          </li>
        ) : !notes?.length ? (
          <li className="text-xs text-gray-500">No recent notes.</li>
        ) : (
          notes.map((note) => (
            <li key={note.id} className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
              <div>
                <div className="text-gray-700">
                  {note.notes?.slice(0, 80) || "—"}
                </div>
                <div className="text-[11px] text-gray-400">
                  {note.created_by ?? "System"} ·{" "}
                  {note.created_at
                    ? new Date(note.created_at).toLocaleString()
                    : ""}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
