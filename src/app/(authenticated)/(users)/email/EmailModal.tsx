import { useUpdateEmailContent, EmailContent } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, notification } from "antd";
import { useFormik } from "formik";

interface EmailModalProps {
  modalOpen: boolean;
  onCancel: VoidFunction;
  initialValues: EmailContent | null;
}

const EmailModal = ({ modalOpen, onCancel, initialValues }: EmailModalProps) => {
  const updateEmailContent = useUpdateEmailContent();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      subject: initialValues?.subject || "",
      body: initialValues?.body || "",
    },
    onSubmit: (values) => {
      if (!initialValues) return;
      updateEmailContent.mutate(
        { id: initialValues.id, ...values },
        {
          onSuccess: () => {
            onCancel();
            notification.success({
              message: "Success",
              description: "Email template updated successfully.",
            });
          },
        },
      );
    },
  });

  return (
    <Modal
      open={modalOpen}
      onCancel={onCancel}
      title={`Edit Email — ${initialValues?.email_name ?? ""}`}
      footer={null}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col gap-4">
          <Input
            label="Subject"
            name="subject"
            value={formik.values.subject}
            onChange={formik.handleChange}
            required
          />
          <div>
            <label className="mb-1 text-xs flex items-center gap-1">Body</label>
            {/* No rich-text editor dependency exists in this app; the backend
                renders bodies server-side with `marked`, so they're authored
                as Markdown source rather than HTML — a plain textarea matches
                that source format. */}
            <textarea
              name="body"
              value={formik.values.body}
              onChange={formik.handleChange}
              rows={14}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none font-mono"
            />
          </div>
        </div>
        <div className="mt-4">
          <ModalFooter
            loading={updateEmailContent.isPending}
            onCancel={onCancel}
            mode="edit"
          />
        </div>
      </form>
    </Modal>
  );
};

export default EmailModal;
