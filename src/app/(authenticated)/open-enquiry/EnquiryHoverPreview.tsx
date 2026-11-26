"use client";

/* Hover preview card for an Open Enquiry row.

   Built from the same pieces as the page's side panel (gradient header,
   coloured status dot, icon + label/value rows, "Record Deposit"-style
   section labels, Notes-tab note styling) so it reads as part of that panel
   rather than a new visual language.

   Display-only: no buttons, and `pointer-events-none` so it can never block
   a click on the rows it overlaps.

   Rendered in a portal with `position: fixed`, anchored beside the row's
   Name cell and flipped left/up when it would run off-screen. Showing,
   hiding and hover timing live in the page (see useEnquiryHoverPreview
   below); this component only draws the card. */

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { CalendarDays, Check, MapPin, Phone, Sparkles, Wallet } from "lucide-react";
import type { OpenEnquiryList } from "@/src/api/enquiry";

export interface PreviewItem {
  id: string | number;
  name: string;
  quantity: number;
}

const CARD_W = 320;
const EDGE = 16;
const GAP = 12;
const MAX_ITEMS = 4;

/* Money arrives in three shapes on this endpoint: a VARCHAR string
   (total_cost_for_equipment, possibly "£4,650" or even "NaN"), a number, or
   a serialized Prisma Decimal ({ d: [...] }) for deposit_amount. */
export function toAmount(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "object") {
    const obj = v as { d?: unknown[]; amount?: unknown };
    if (Array.isArray(obj.d) && obj.d.length) return toAmount(obj.d[0]);
    if (obj.amount != null) return toAmount(obj.amount);
    return undefined;
  }
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

const gbp = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

function relativeAge(created?: string) {
  if (!created) return null;
  const d = dayjs().startOf("day").diff(dayjs(created).startOf("day"), "day");
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

function untilEvent(date?: string) {
  if (!date) return null;
  const d = dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
  if (d < 0) return "passed";
  if (d === 0) return "today";
  if (d <= 60) return `in ${d} day${d === 1 ? "" : "s"}`;
  const m = Math.round(d / 30.4);
  return `in ${m} month${m === 1 ? "" : "s"}`;
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
        <p className="text-sm text-gray-900 truncate">{children}</p>
      </div>
    </div>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        done ? "text-primary" : "text-gray-400"
      }`}
    >
      <span
        className={`size-4 rounded-full inline-flex items-center justify-center ${
          done ? "bg-primary text-white" : "border border-gray-300"
        }`}
      >
        {done && <Check size={11} strokeWidth={3} />}
      </span>
      {label}
    </span>
  );
}

export default function EnquiryHoverPreview({
  record,
  anchor,
  status,
}: {
  record: OpenEnquiryList | null;
  anchor: HTMLElement | null;
  status: { label: string; className: string } | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Measure after render so the flip-up logic knows the card's real height.
  useLayoutEffect(() => {
    if (!record || !anchor || !cardRef.current) {
      setPos(null);
      return;
    }
    const r = anchor.getBoundingClientRect();
    const h = cardRef.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = r.right + GAP;
    if (left + CARD_W > vw - EDGE) left = Math.max(EDGE, r.left - CARD_W - GAP);
    let top = r.top - 16;
    if (top + h > vh - EDGE) top = Math.max(EDGE, vh - h - EDGE);
    setPos({ left, top });
  }, [record, anchor]);

  if (!record || typeof document === "undefined") return null;

  const user = record.users_events_user_idTousers as
    | { name?: string; contact_number?: string }
    | undefined;
  const venue = (record.venues as { venue?: string } | undefined)?.venue;
  const eventType = record.dj_package_name as string | undefined;
  const date = record.date as string | undefined;
  const created = record.created_at as string | undefined;
  const items = (record.preview_items as PreviewItem[] | undefined) ?? [];
  const latestNote = record.event_notes?.[0] as
    | { notes?: string; created_at?: string }
    | undefined;
  const total = toAmount(record.total_cost_for_equipment);
  const deposit = toAmount(record.deposit_amount);
  const age = relativeAge(created);
  const until = untilEvent(date);

  return createPortal(
    <div
      ref={cardRef}
      role="tooltip"
      aria-label={`Preview of ${user?.name || "enquiry"}`}
      className={`fixed z-[1050] w-[320px] bg-white rounded-2xl overflow-hidden border border-gray-100 pointer-events-none transition-[opacity,transform] duration-150 [&>div:last-child]:border-b-0 ${
        pos ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? 0,
        boxShadow:
          "0 10px 30px -8px rgba(42,45,50,.18), 0px 1px 3px 0px #0000001A",
      }}
    >
      {/* Header — same gradient, name and status dot as the side panel */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-slate-50">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-base truncate leading-tight">
            {user?.name || (record.usr_name as string) || "Enquiry"}
          </h3>
          {status && (
            <span
              className={`text-xs font-medium inline-flex items-center gap-1 shrink-0 ${status.className}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {status.label}
            </span>
          )}
        </div>
        {age && (
          <p className="text-xs text-gray-400 mt-1">Enquiry received {age}</p>
        )}
      </div>

      <div className="px-5 py-4 space-y-3 border-b border-gray-100">
        <Field icon={CalendarDays} label="Event Date">
          {date ? dayjs(date).format("DD/MM/YYYY") : "--"}
          {until && <span className="text-gray-400"> · {until}</span>}
        </Field>
        <Field icon={Sparkles} label="Event Type">
          {eventType || "--"}
        </Field>
        <Field icon={MapPin} label="Location">
          {venue || "--"}
        </Field>
        <Field icon={Phone} label="Mobile">
          {user?.contact_number || "--"}
        </Field>
        {total ? (
          <Field icon={Wallet} label="Quote / Deposit">
            {gbp(total)}
            <span className="text-gray-400">
              {" "}
              · {deposit ? `${gbp(deposit)} deposit` : "no deposit"}
            </span>
          </Field>
        ) : null}
      </div>

      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4">
        <Step done={Boolean(record.called)} label="Called" />
        <Step done={Boolean(record.brochure_emailed)} label="Brochure" />
        <Step done={Boolean(record.quoted)} label="Quoted" />
      </div>

      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1.5">Equipment</p>
        {items.length ? (
          <>
            <ul>
              {items.slice(0, MAX_ITEMS).map((it) => (
                <li
                  key={it.id}
                  className="py-1 border-b border-gray-200 last:border-0 flex justify-between gap-3 text-sm"
                >
                  <span className="text-gray-700 truncate">{it.name}</span>
                  <span className="text-gray-400 shrink-0">×{it.quantity}</span>
                </li>
              ))}
            </ul>
            {items.length > MAX_ITEMS && (
              <p className="text-xs font-medium text-primary mt-1">
                +{items.length - MAX_ITEMS} more
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">No equipment added yet</p>
        )}
      </div>

      {latestNote?.notes && (
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-1.5">Latest Note</p>
          {latestNote.created_at && (
            <p className="text-xs leading-tight text-gray-400">
              {dayjs(latestNote.created_at).format("DD/MM/YY HH:mm")}
            </p>
          )}
          <p className="text-sm leading-snug text-gray-700 line-clamp-3">
            {latestNote.notes}
          </p>
        </div>
      )}

    </div>,
    document.body,
  );
}

/* Hover timing: wait ~350ms before the first card so skimming the list
   doesn't flash cards; once one is open, moving to another row swaps almost
   instantly. A short close delay stops the card flickering off and on
   between adjacent rows. Only enabled on devices with a real hovering pointer — on touch,
   tapping a row already opens the side panel. */
export function useEnquiryHoverPreview() {
  const [state, setStateRaw] = useState<{
    record: OpenEnquiryList;
    anchor: HTMLElement;
  } | null>(null);
  const openT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors `state !== null` for the timers, which can't read fresh state.
  const openRef = useRef(false);
  const setState = (next: typeof state) => {
    openRef.current = next !== null;
    setStateRaw(next);
  };

  const clear = (t: typeof openT) => {
    if (t.current) clearTimeout(t.current);
    t.current = null;
  };

  const canHover = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const hide = () => {
    clear(openT);
    clear(closeT);
    setState(null);
  };

  const rowEnter = (record: OpenEnquiryList, row: HTMLElement) => {
    if (!canHover()) return;
    clear(closeT);
    clear(openT);
    const anchor =
      (row.querySelector(".enquiry-name-cell") as HTMLElement | null) ?? row;
    openT.current = setTimeout(
      () => setState({ record, anchor }),
      openRef.current ? 60 : 350,
    );
  };

  const leave = () => {
    clear(openT);
    clear(closeT);
    closeT.current = setTimeout(() => setState(null), 180);
  };

  return { preview: state, rowEnter, leave, hide };
}
