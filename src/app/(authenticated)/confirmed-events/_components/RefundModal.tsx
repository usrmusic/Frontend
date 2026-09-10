"use client";
import { Modal } from "antd";
import Button from "@/src/components/Button";
import Input from "@/src/components/Input";

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
  cancelText?: string;
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
  confirmText = "Yes",
  cancelText = "No",
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

  return (
    <Modal open={open} onCancel={onCancel} footer={false} title={title}>
      <div className="space-y-4 pt-2">
        <p className="text-sm text-gray-700">{description}</p>

        <p className="text-sm font-semibold text-gray-900">
          Event Total Amount: {formatCurrency(eventTotal)} &nbsp;&nbsp; Paid Amount:{" "}
          {formatCurrency(paidAmount ?? null)}
        </p>

        <Input
          label={`Please Enter Your Refund Amount${!requireAmount ? " (optional)" : ""}`}
          type="number"
          min={0}
          value={refundAmount}
          placeholder="Refund Amount"
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return setRefundAmount("");
            const num = Number(raw);
            if (Number.isNaN(num)) return;
            setRefundAmount(num < 0 ? "0" : raw);
          }}
        />

        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> {warningText}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={onCancel}>{cancelText}</Button>
          <Button
            onClick={handleRefund}
            type="primary"
            variant="solid"
            loading={isProcessing}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
