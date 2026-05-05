"use client";
import { Modal, Button } from "antd";
import { useState } from "react";
import Input from "@/src/components/Input";

interface SendInvoiceModalProps {
  open: boolean;
  onCancel: VoidFunction;
  eventId: string;
  template: { subject: string; body: string } | null;
  onSend: (subject: string, body: string) => void;
  isSending: boolean;
}

export const SendInvoiceModal = ({
  open,
  onCancel,
  eventId,
  template,
  onSend,
  isSending,
}: SendInvoiceModalProps) => {
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      alert("Please fill in both subject and body");
      return;
    }
    onSend(subject, body);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Send Invoice"
      footer={[
        <button
          key="cancel"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>,
        <button
          key="send"
          onClick={handleSend}
          disabled={isSending}
          className="ml-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSending ? "Sending..." : "Send"}
        </button>,
      ]}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="Enter email subject"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            placeholder="Enter email body"
            rows={6}
          />
        </div>
      </div>
    </Modal>
  );
};
