import { useCompanyDropdown } from "@/src/api/dropdown";
import { useSendQuote } from "@/src/api/enquiry";
import Button from "@/src/components/Button";
import Input from "@/src/components/Input";
import { Modal, Select } from "antd";
import { useFormik } from "formik";
import { toast } from "react-toastify";

interface BrochureProps {
  open: boolean;
  onCancel: VoidFunction;
  eventId: string;
  sendMode: "brochure" | "quote" | "invoice";
  template?: {
    id?: string;
    email_name?: string;
    subject?: string;
    body?: string;
  } | null;
  companies?: Array<{ id: string | number; name: string }> | null;
}

const MODAL_TITLES = {
  brochure: "Send Brochure",
  quote: "Send Quote",
  invoice: "Send Invoice",
};

const SendBrochureModal = ({
  open,
  onCancel,
  eventId,
  sendMode,
  template,
  companies,
}: BrochureProps) => {
  const { data: companyNameOptions } = useCompanyDropdown();
  const { mutateAsync: sendQuoteMutation, isPending: quoteLoading } =
    useSendQuote();

  const isPending = quoteLoading;

  const companiesList = companies ?? companyNameOptions?.data ?? [];
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      event_id: Number(eventId),
      company_name_id:
        companiesList && companiesList.length
          ? String(companiesList[0].id)
          : "",
      subject: template?.subject ?? "Brochure",
      body:
        template?.body ??
        `Thank you very much for your interest in booking us for your event.\n\nPlease find attached a copy of our brochure. This will give you lots of inspiration, creating the perfect look for your big day! \n\nPlease get in touch after browsing the brochure to arrange a more in depth chat. We believe face to face or even a quick chat on the phone allows better understanding of your event so that we can tailor the package based on your requirements and budget! :)\n\nThank you once again,`,
    },
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        const payload = {
          event_id: Number(values.event_id) || Number(eventId),
          subject: values.subject,
          body: values.body,
          company_name_id:
            Number(values.company_name_id) ||
            Number((companiesList[0] && companiesList[0].id) || 0),
        } as any;

        // Prefix subject with returned email_name when available
        if (template?.email_name) {
          payload.subject = `${template.email_name} - ${payload.subject}`;
        }

        // Use single send (quote) API for all send modes as requested
        await sendQuoteMutation(payload);
        toast.success("Email Sent Successfully");

        onCancel();
      } catch (err) {
        console.error(err);
        toast.error("Failed to send email");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={false}
      title={MODAL_TITLES[sendMode as keyof typeof MODAL_TITLES]}
    >
      <form className="space-y-4" onSubmit={formik.handleSubmit}>
        <div>
          <label className="block mb-1 font-medium text-xs text-gray-700">
            Company Name
          </label>
          <Select
            className="w-full bg-secondary-100!"
            placeholder="Select company"
            options={(companiesList || []).map((opt: any) => ({
              label: opt.name,
              value: String(opt.id),
            }))}
            value={String(formik.values.company_name_id) || undefined}
            onChange={(value) => formik.setFieldValue("company_name_id", value)}
          />
        </div>
        <Input
          type="text"
          placeholder="Subject"
          label="Subject"
          name="subject"
          value={formik.values.subject}
          onChange={formik.handleChange}
        />
        <div>
          <label className="block mb-1 font-medium text-xs text-gray-700">
            Body
          </label>
          <textarea
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
            rows={8}
            placeholder="Write your message here..."
            name="body"
            value={formik.values.body}
            onChange={formik.handleChange}
          ></textarea>
        </div>
        <div className="flex justify-end gap-3">
          <Button htmlType="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            htmlType="submit"
            type="primary"
            loading={formik.isSubmitting}
          >
            Send Email
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SendBrochureModal;
