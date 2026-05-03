"use client";
import { Modal } from "antd";

interface RefundModalProps {
  open: boolean;
  onCancel: VoidFunction;
  onRefund: (amount: string) => void;
  isProcessing: boolean;
  refundAmount: string;
  setRefundAmount: (amount: string) => void;
  eventTotal?: number | null;
  paidAmount?: number | null;
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
}: RefundModalProps) => {
  const handleRefund = () => {
    if (!String(refundAmount || "").trim() || Number(refundAmount) <= 0) {
      alert("Please enter a valid refund amount");
      return;
    }
    onRefund(refundAmount);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={null}
      footer={null}
      centered
    >
      <div className="rounded-lg overflow-hidden">
        <div className="bg-primary px-4 py-3">
          <h3 className="text-white text-lg font-semibold">Refund</h3>
        </div>
        <div className="p-5">
          <p className="font-semibold mb-3">Are you sure you want to refund the amount for this event</p>
          <p className="font-bold mb-3">
            Event Total Amount:{eventTotal ?? "—"} &nbsp;&nbsp; Paid Amount:{paidAmount ?? "—"}
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Please Enter Your Refund Amount</label>
            <input
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Refund Amount"
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Refunds cannot be reversed. Please confirm the amount carefully.
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
              {isProcessing ? "Processing..." : "YES"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
