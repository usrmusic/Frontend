"use client";
import { useMemo, useState } from "react";
import { Skeleton, Modal } from "antd";
import { useQuery } from "@tanstack/react-query";
import Card from "@/src/components/Card";
import AxiosInstance from "@/src/lib/axios";

type TodoItem = {
  id: number;
  title?: string;
  detail?: string;
  completed?: boolean;
  event_id?: number;
};

export default function DashboardTodos({ eventIds }: { eventIds: number[] }) {
  const [selected, setSelected] = useState<TodoItem | null>(null);
  const [open, setOpen] = useState(false);

  // Determine whether to fetch user-assigned todos (team scope) or per-event todos.
  // For team dashboard we prefer the logged-in user's todos; the parent passes
  // `eventIds` but we will use `/todos/mine` so the UI shows personal tasks.
  const ids = useMemo(() => (Array.isArray(eventIds) ? eventIds.slice(0, 6).filter(Boolean) : []), [eventIds]);
  const idsKey = ids.length ? ids.join(',') : 'mine';

  const { data: todosRaw, isLoading } = useQuery({
    queryKey: ["dashboard-todos", idsKey],
    queryFn: async () => {
      if (!ids.length) {
        // fetch todos assigned to current user
        const resp = await AxiosInstance.get<TodoItem[]>(`/todos/mine`);
        return (resp.data || []).map((t) => ({ ...t, event_id: t.event_id || null }));
      }
      // fetch todos for provided event ids (batch)
      const results = await Promise.all(ids.map((id) => AxiosInstance.get<TodoItem[]>(`/todos/${id}`).then((r) => ({ id, list: r.data })).catch(() => ({ id, list: [] }))));
      const merged: TodoItem[] = [];
      for (const r of results) {
        const list = (r as any).list || [];
        for (const t of list) merged.push({ ...t, event_id: (r as any).id });
      }
      return merged.slice(0, 12);
    },
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 5,
  });

  const todos = todosRaw || [];

  return (
    <Card variant="white" className="shadow-sm p-4 flex flex-col h-full min-h-[300px]">
      <div className="mb-3">
        <p className="text-base font-semibold text-gray-900">Todo List</p>
      </div>
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <Skeleton active />
        </div>
      ) : !todos.length ? (
        <div className="text-xs text-gray-500">No todos available.</div>
      ) : (
        <>
          <ul className="space-y-2 text-sm max-h-[260px] overflow-auto no-scrollbar flex-1">
            {todos.map((t) => (
              <li
                key={t.id}
                className="flex items-start gap-3 border-b last:border-0 pb-2 cursor-pointer hover:bg-gray-50"
                onClick={() => { setSelected(t); setOpen(true); }}
              >
                <div className="flex-1">
                  <div className="font-medium">{t.title || `Task #${t.id}`}</div>
                  <div className="text-xs text-gray-500 truncate">{t.detail || ''}</div>
                </div>
                <div className="text-xs text-gray-400">{t.event_id ? `E:${t.event_id}` : ''}</div>
              </li>
            ))}
          </ul>
          <Modal
            title={selected?.title || "Todo Detail"}
            open={open}
            onCancel={() => setOpen(false)}
            footer={null}
          >
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{selected?.detail || "No additional details."}</div>
            <div className="text-xs text-gray-400 mt-3">{selected?.event_id ? `Event: ${selected.event_id}` : ''}</div>
          </Modal>
        </>
      )}
    </Card>
  );
}
