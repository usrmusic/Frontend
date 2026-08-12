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
    <Card variant="white" className="col-span-12 lg:col-span-3 flex flex-col shadow-sm p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            Events Activity
          </h4>
        </div>
      </div>
      <ul className="mb-4 no-scrollbar text-sm max-h-[260px] overflow-auto">
        {isLoading ? (
          <li className="flex items-center py-2">
            <Skeleton active paragraph={false} />
          </li>
        ) : !notes?.length ? (
          <li className="text-sm text-gray-500 py-2">No recent notes.</li>
        ) : (
          notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start gap-2 py-2 border-b border-[#636363] last:border-0"
            >
              <span className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-700 truncate" title={note.notes ?? undefined}>
                  {note.notes || "—"}
                </div>
                <div className="text-xs text-gray-400 truncate">
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
