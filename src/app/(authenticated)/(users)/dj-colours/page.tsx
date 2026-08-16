"use client";
import { useDjColors, useSaveDjColor, DjColor } from "@/src/api/usersApi";
import Avatar from "@/src/components/common/Avatar";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import { ColorPicker, Spin } from "antd";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

const FALLBACK = "#9CA3AF"; // neutral grey — matches the calendar's unassigned fallback

const DjColoursPage = () => {
  const { data, isLoading } = useDjColors();
  const saveColor = useSaveDjColor();
  // Draft colours per-DJ, so a swatch pick doesn't save until "Save" is
  // pressed — matches the rest of the app's explicit-save pattern rather than
  // auto-saving on every picker interaction.
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const djs = data?.data ?? [];

  const colorFor = (dj: DjColor) => drafts[dj.id] ?? dj.color ?? "";

  // Soft, non-blocking duplicate check — computed from the drafts currently
  // shown, not just the saved values, so it warns before a save creates a
  // clash rather than only after.
  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    djs.forEach((dj) => {
      const c = colorFor(dj);
      if (!c) return;
      counts[c.toLowerCase()] = (counts[c.toLowerCase()] || 0) + 1;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [djs, drafts]);

  const isDuplicate = (dj: DjColor) => {
    const c = colorFor(dj);
    return !!c && (colorCounts[c.toLowerCase()] || 0) > 1;
  };

  const isDirty = (dj: DjColor) => drafts[dj.id] !== undefined && drafts[dj.id] !== (dj.color ?? "");

  const handlePick = (dj: DjColor, hex: string) => {
    setDrafts((prev) => ({ ...prev, [dj.id]: hex }));
  };

  const handleSave = (dj: DjColor) => {
    const color = drafts[dj.id];
    setSavingId(dj.id);
    saveColor.mutate(
      { id: dj.id, color: color || null },
      {
        onSuccess: () => {
          toast.success(`Colour saved for ${dj.name || "DJ"}`);
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[dj.id];
            return next;
          });
        },
        onSettled: () => setSavingId(null),
      },
    );
  };

  return (
    <div className="space-y-4 mt-4">
      <Card variant="white" className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">DJ Colours</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Set each DJ&apos;s colour so their bookings are colour-coded consistently across the calendar.
            A DJ with no colour set shows as neutral grey.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : djs.length === 0 ? (
          <p className="text-sm text-gray-500 px-5 py-8 text-center">No DJs found.</p>
        ) : (
          <ul>
            {djs.map((dj) => {
              const current = colorFor(dj);
              const dirty = isDirty(dj);
              const duplicate = isDuplicate(dj);
              return (
                <li
                  key={dj.id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0"
                >
                  <Avatar src={dj.profile_photo} initials={(dj.name || "DJ").slice(0, 2).toUpperCase()} size={36} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{dj.name || "Unnamed"}</p>
                    <p className="text-xs text-gray-400 truncate">{dj.email}</p>
                  </div>

                  <span className="text-xs text-gray-400 shrink-0 w-20 text-right">
                    {dj.event_count} event{dj.event_count === 1 ? "" : "s"}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <ColorPicker
                      value={current || FALLBACK}
                      onChangeComplete={(c) => handlePick(dj, c.toHexString())}
                      showText={() => (
                        <span className="text-xs text-gray-600 font-mono">
                          {current || "Not set"}
                        </span>
                      )}
                    />
                    {duplicate && (
                      <span
                        className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap"
                        title="Another DJ already uses this colour"
                      >
                        Already used
                      </span>
                    )}
                  </div>

                  <Button
                    type="primary"
                    className="shrink-0 w-20"
                    disabled={!dirty}
                    loading={savingId === dj.id}
                    onClick={() => handleSave(dj)}
                  >
                    Save
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default DjColoursPage;
