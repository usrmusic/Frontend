"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { DatePicker, Select, ConfigProvider } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Plus, Printer, SquareCheckBig, X } from "lucide-react";
import Input from "@/src/components/Input";
import { useGetConfirmEvent, useAddConfirmPayment } from "@/src/api/events";
import type { ConfirmEventPackage, ConfirmEventPayment } from "@/src/types/types";

/* The confirmed-events drawer, extracted so the dashboard's Pending Payments
   card can open the exact same drawer rather than a rebuilt lookalike that
   would silently drift from it over time. Fully self-contained: given just an
   eventId it fetches its own data and owns all of its own local state (the
   original had these as page-level state in confirmed-events/page.tsx, but
   grepped clean — none of them were referenced anywhere outside this drawer's
   own markup, so moving them here changes nothing about how that page behaves).

   Package Summary + Rig List + Add Payment form + Payment Summary + the
   rig-list print sheet — this is the whole drawer, not a trimmed subset. */

// Matches the live payment_methods table (id -> name): 1 Cash, 2 BACS,
// 3 Other.
const PAYMENT_METHOD_OPTIONS = [
  { label: "Cash", value: "1" },
  { label: "BACS", value: "2" },
  { label: "Other", value: "3" },
];

interface EventPaymentDrawerProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  // Add Payment is Admin-only (matches the legacy Laravel CRM); Package
  // Summary, Rig List, and the read-only Payment Summary stay visible to
  // Staff too — only the form itself is gated.
  canAddPayment?: boolean;
  // Client gets a stripped-down view — matches Laravel's Client-facing
  // sidebar panel (sidebar_ui_new.blade.php): equipment checklist +
  // read-only Total/Deposit/Outstanding only. No Edit (routes into the
  // internal enquiry-builder), no Print/Rig List (never a Client feature).
  isClientView?: boolean;
}

export default function EventPaymentDrawer({ eventId, open, onClose, canAddPayment = true, isClientView = false }: EventPaymentDrawerProps) {
  const router = useRouter();
  const { data: selectedEventData } = useGetConfirmEvent(eventId);
  const { mutate: addPaymentMutation, isPending: isAddingPayment } = useAddConfirmPayment();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Dayjs | null>(dayjs());
  const [paymentMethodId, setPaymentMethodId] = useState<string | number>("");
  const [rigOpen, setRigOpen] = useState(false);
  const [printRig, setPrintRig] = useState(false);

  // window.print() reads the DOM synchronously, so it has to fire from an
  // effect that runs after `printRig` has actually applied — same mechanism
  // as the New Enquiry page's rig print.
  useEffect(() => {
    if (!printRig) return;
    document.body.classList.add("print-scoped");
    const cleanup = () => {
      document.body.classList.remove("print-scoped");
      window.removeEventListener("afterprint", cleanup);
      setPrintRig(false);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    return () => {
      document.body.classList.remove("print-scoped");
      window.removeEventListener("afterprint", cleanup);
    };
  }, [printRig]);

  const paymentsSum = (selectedEventData?.data?.event_payments || []).reduce(
    (s: number, p: ConfirmEventPayment) => s + Number(p.amount || p.payment_amount || 0),
    0,
  );
  const eventRefundAmount = Number(selectedEventData?.data?.refund_amount || 0) || 0;
  const adjustedPaidAmount = Math.max(0, paymentsSum - eventRefundAmount);
  const totalCost =
    Number(selectedEventData?.data?.total_cost_for_equipment) ||
    (selectedEventData?.data?.event_packages || []).reduce(
      (s: number, p: ConfirmEventPackage) => s + Number(p.total_price || p.sell_price || 0),
      0,
    );

  const handleClose = () => {
    setPaymentAmount("");
    setPaymentDate(dayjs());
    setPaymentMethodId("");
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 pointer-events-none transition-all duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
          onClick={handleClose}
        />

        <aside
          className={`pointer-events-auto fixed right-0 top-0 h-full w-[420px] bg-white shadow-xl z-50 transform transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-labelledby="event-payment-drawer-title"
        >
          <div className="h-full flex flex-col bg-white">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gradient-to-r from-white to-slate-50">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Payment</p>
                <h3 id="event-payment-drawer-title" className="themeH1 text-lg mt-1">
                  {selectedEventData?.data?.company?.name || "USR Music Ltd"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{selectedEventData?.data?.venues?.venue ?? ""}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close drawer"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="p-6 space-y-6">
                {/* Package Summary Section */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Package Summary</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedEventData?.data?.dj_package_name || "DJ Package"}</p>
                    </div>
                    {/* Print (rig list) and Edit (routes into the internal
                        enquiry builder) — never a Client feature. */}
                    {!isClientView && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrintRig(true)}
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-white rounded-lg transition-colors"
                          aria-label="Print rig list"
                          title="Print rig list and notes"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors"
                          onClick={() => router.push(`/enquiry?select=${encodeURIComponent(String(eventId))}`)}
                          title="Edit enquiry details"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Equipment Names Only */}
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    {(selectedEventData?.data?.event_packages)?.length ? (
                      <div className="space-y-1">
                        {(selectedEventData?.data?.event_packages).map((p: ConfirmEventPackage) => (
                          <div key={p.id} className="flex items-start gap-2">
                            <SquareCheckBig size={14} className="text-primary flex-shrink-0 mt-0.5" />
                            <p className="font-medium text-sm text-gray-900">{p.equipment?.name || p.package_name || p.name || "Item"}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-2">No equipment items</p>
                    )}
                  </div>
                </div>

                {/* Rig List Section — never a Client feature (matches the
                    legacy Laravel CRM's sidebar_ui_new.blade.php, which hides
                    the mini rig-list accordion specifically for role_id 4).
                    Plain anchor-style toggle when collapsed; the boxed panel
                    only mounts once expanded, so no empty box lingers. */}
                {!isClientView && (
                <div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm font-medium text-primary"
                      onClick={() => setRigOpen((s) => !s)}
                    >
                      Rig List
                      <Plus size={15} className={`transition-transform duration-300 ${rigOpen ? "rotate-45" : ""}`} />
                    </button>
                  </div>
                  {rigOpen && (
                    <div className="mt-2 text-xs text-gray-700 space-y-3">
                      {(selectedEventData?.data?.event_packages)?.length ? (
                        (selectedEventData?.data?.event_packages).map((p: ConfirmEventPackage) => (
                          <div key={p.id} className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <SquareCheckBig size={14} className="text-primary shrink-0" />
                              <p className="font-semibold text-gray-900 leading-tight">{p.equipment?.name || p.package_name || p.name || "Item"}</p>
                            </div>
                            {p.rig_notes && (
                              <p
                                className="pl-6 text-[11px] text-gray-500 leading-snug whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: p.rig_notes }}
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-500 py-2">No rig notes</p>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Payment Form Section — Admin only */}
                {canAddPayment && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900">Add Payment</h4>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!eventId) return;
                      const dateIso = paymentDate ? paymentDate.toISOString() : new Date().toISOString();
                      addPaymentMutation(
                        {
                          id: eventId,
                          payload: {
                            payment_method_id: paymentMethodId ? Number(paymentMethodId) : undefined,
                            amount: Number(paymentAmount || 0),
                            date: dateIso,
                          },
                        },
                        {
                          onSuccess: () => {
                            setPaymentAmount("");
                            setPaymentDate(dayjs());
                            setPaymentMethodId("");
                          },
                        },
                      );
                    }}
                    className="space-y-4"
                  >
                    <Input
                      label="Amount"
                      type="number"
                      placeholder="0.00"
                      min={0}
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 text-xs block">Date</label>
                        <DatePicker
                          placeholder="DD/MM/YYYY"
                          className="w-full"
                          format="DD-MM-YYYY"
                          value={paymentDate}
                          onChange={(val) => setPaymentDate(val)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 text-xs block">Method</label>
                        <ConfigProvider theme={{ token: { borderRadius: 12 } }}>
                          <Select
                            placeholder="Select method"
                            className="w-full"
                            value={paymentMethodId ? String(paymentMethodId) : undefined}
                            onChange={(val) => setPaymentMethodId(val)}
                            options={PAYMENT_METHOD_OPTIONS}
                          />
                        </ConfigProvider>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isAddingPayment}
                      >
                        {isAddingPayment ? "Saving..." : "Add Payment"}
                      </button>
                    </div>
                  </form>
                </div>
                )}

                {/* Payment Summary */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-emerald-900">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-gray-900">£{totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Received:</span>
                      <span className="font-semibold text-gray-900">£{adjustedPaidAmount.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-emerald-200 flex justify-between">
                      <span className="font-semibold text-emerald-900">Outstanding:</span>
                      <span className="font-bold text-emerald-900">
                        £{(totalCost - adjustedPaidAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Rig list print sheet — portalled to <body> so it isn't clipped by the
          drawer's own scroll container, no total price, themed in text/rules
          rather than filled colour so it survives "background graphics" being
          off in the print dialog. */}
      {printRig &&
        createPortal(
          <div id="print-section" className="p-2 text-black">
            <div className="mb-4 border-b-2 border-[#719984] pb-2">
              <h1 className="text-lg font-semibold text-[#719984]">Rig List</h1>
              {selectedEventData?.data?.dj_package_name && (
                <p className="text-xs">{selectedEventData.data.dj_package_name}</p>
              )}
            </div>

            <table className="mb-5 text-xs">
              <tbody>
                {[
                  ["Client", selectedEventData?.data?.users_events_user_idTousers?.name],
                  ["Venue", selectedEventData?.data?.venues?.venue],
                  ["Event Date", selectedEventData?.data?.date ? dayjs(selectedEventData.data.date).format("DD/MM/YYYY") : ""],
                  [
                    "Time",
                    selectedEventData?.data?.start_time && selectedEventData?.data?.end_time
                      ? `${selectedEventData.data.start_time} – ${selectedEventData.data.end_time}`
                      : selectedEventData?.data?.start_time,
                  ],
                ]
                  .filter(([, v]) => Boolean(v))
                  .map(([label, v]) => (
                    <tr key={String(label)}>
                      <td className="pr-4 align-top font-medium">{label}</td>
                      <td className="align-top">{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#719984]">Equipment</h2>
            {(selectedEventData?.data?.event_packages)?.length ? (
              <ul className="mb-5 text-xs">
                {selectedEventData.data.event_packages.map((p: ConfirmEventPackage) => (
                  <li key={p.id} className="border-b border-gray-300 py-1.5">
                    <span className="font-medium">{p.equipment?.name || p.package_name || p.name || "Item"}</span>
                    {p.notes && (
                      <>
                        {" — "}
                        <span className="whitespace-pre-line italic" dangerouslySetInnerHTML={{ __html: p.notes }} />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-5 text-xs italic">No items selected</p>
            )}

            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#719984]">Rig Notes</h2>
            {(selectedEventData?.data?.event_packages)?.some((p: ConfirmEventPackage) => p.rig_notes) ? (
              <ul className="text-xs">
                {selectedEventData.data.event_packages
                  .filter((p: ConfirmEventPackage) => p.rig_notes)
                  .map((p: ConfirmEventPackage) => (
                    <li key={p.id} className="border-b border-gray-300 py-1.5">
                      <p className="font-medium">{p.equipment?.name || p.package_name || p.name || "Item"}</p>
                      <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: p.rig_notes ?? "" }} />
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-xs italic">No rig notes</p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
