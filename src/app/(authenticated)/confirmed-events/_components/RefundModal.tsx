"use client";
import { X } from "lucide-react";

interface RefundModalProps {
  open: boolean;
  onCancel: VoidFunction;
  onRefund: (amount: string) => void;
  isProcessing: boolean;
  refundAmount: string;
  setRefundAmount: (amount: string) => void;
  eventTotal?: number | null;
  paidAmount?: number | null;
  // Lets this same modal double as the Cancel Event confirmation (matches
  // Laravel, which embeds the refund box directly in the cancel popup rather
  // than treating it as a separate step). Defaults keep the standalone
  // Refund button's existing copy unchanged.
  title?: string;
  description?: string;
  confirmText?: string;
  // Cancel's refund is optional (0 is a valid, common case) — the standalone
  // Refund action still requires a positive amount.
  requireAmount?: boolean;
  warningText?: string;
}

export const RefundModal = ({
  open,
  onCancel,
  onRefund,
  isProcessing,
  refundAmount,
  setRefundAmount,
  eventTotal = null,
  paidAmount = null,
  title = "Refund",
  description = "Are you sure you want to refund the amount for this event",
  confirmText = "YES",
  requireAmount = true,
  warningText = "Refunds cannot be reversed. Please confirm the amount carefully.",
}: RefundModalProps) => {
  const formatCurrency = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "—";
    const n = Number(v) || 0;
    return `£${n.toLocaleString()}`;
  };
  const handleRefund = () => {
    if (requireAmount && (!String(refundAmount || "").trim() || Number(refundAmount) <= 0)) {
      alert("Please enter a valid refund amount");
      return;
    }
    if (Number(refundAmount) > Number(paidAmount ?? Infinity)) {
      alert("Refund amount cannot be greater than paid amount");
      return;
    }
    onRefund(refundAmount || "0");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[600px] max-w-[95%] bg-white rounded-xl shadow-xl"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 inline-flex items-center justify-center p-2 bg-white rounded-full shadow-md text-gray-700"
        >
          <X size={18} />
        </button>

        <div className="bg-primary px-6 py-4 rounded-t-xl">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
        </div>

        <div className="p-6">
          <p className="font-semibold mb-3">{description}</p>
          <p className="font-bold mb-3">
            Event Total Amount: {formatCurrency(eventTotal)} &nbsp;&nbsp; Paid Amount: {formatCurrency(paidAmount ?? null)}
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please Enter Your Refund Amount{!requireAmount ? " (optional)" : ""}
            </label>
            <input
              type="number"
              min={0}
              value={refundAmount}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return setRefundAmount("");
                const num = Number(raw);
                if (Number.isNaN(num)) return;
                setRefundAmount(num < 0 ? "0" : raw);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Refund Amount"
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> {warningText}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              NO
            </button>
            <button
              onClick={handleRefund}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
