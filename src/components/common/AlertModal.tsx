import { Modal } from "antd";
import React from "react";
import Button from "../Button";

interface AlertModalProps {
  open: boolean;
  handleCancel: VoidFunction;
  onYes: VoidFunction;
  title: React.ReactNode;
  text: string;
  loading: boolean;
}

const AlertModal = ({
  open,
  handleCancel,
  onYes,
  title,
  text,
  loading,
}: AlertModalProps) => {
  return (
    <Modal open={open} onCancel={handleCancel} footer={false} title={title}>
      <p>{text}</p>
      <div className="flex justify-end gap-3">
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={onYes} danger variant="solid" loading={loading}>
          Yes
        </Button>
      </div>
    </Modal>
  );
};

export default AlertModal;
