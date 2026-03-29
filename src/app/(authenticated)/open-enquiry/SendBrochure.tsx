import { useCompanyDropdown } from "@/src/api/dropdown";
import {
  useSendBrochure,
  useSendInvoice,
  useSendQuote,
} from "@/src/api/enquiry";
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
}: BrochureProps) => {
  const { data: companyNameOptions } = useCompanyDropdown();
  const { mutateAsync: sendBrochureMutation, isPending: brochureLoading } =
    useSendBrochure();
  const { mutateAsync: sendQuoteMutation, isPending: quoteLoading } =
    useSendQuote();
  const { mutateAsync: sendInvoiceMutation, isPending: invoiceLoading } =
    useSendInvoice();

  const isPending = brochureLoading || quoteLoading || invoiceLoading;

  const formik = useFormik({
    initialValues: {
      event_id: Number(eventId),
      company_name_id: "",
      subject: "Brochure",
      body: `Thank you very much for your interest in booking us for your event.

Please find attached a copy of our brochure. This will give you lots of inspiration, creating the perfect look for your big day! 

Please get in touch after browsing the brochure to arrange a more in depth chat. We believe face to face or even a quick chat on the phone allows better understanding of your event so that we can tailor the package based on your requirements and budget! :)

Thank you once again,`,
    },
    onSubmit: (values) => {
      // handle form submission, e.g., send API request
      if (sendMode === "brochure") {
        sendBrochureMutation(values, {
          onSuccess: () => {
            toast.success("Brochure Sent Successfully");
            onCancel();
          },
        });
      } else if (sendMode === "quote") {
        sendQuoteMutation(values, {
          onSuccess: () => {
            toast.success("Quote Sent Successfully");
            onCancel();
          },
        });
      } else if (sendMode === "invoice") {
        sendInvoiceMutation(values, {
          onSuccess: () => {
            toast.success("Invoice Sent Successfully");
            onCancel();
          },
        });
      }
      console.log("Send Brochure form values:", values);
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
            className="w-full"
            placeholder="Select company"
            options={companyNameOptions?.data?.map((opt:any) => ({
              label: opt.name,
              value: opt.id,
            }))}
            value={formik.values.company_name_id}
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
          <Button htmlType="submit" onClick={onCancel}>
            Cancel
          </Button>
          <Button htmlType="submit" type="primary" loading={isPending}>
            Send Email
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SendBrochureModal;
