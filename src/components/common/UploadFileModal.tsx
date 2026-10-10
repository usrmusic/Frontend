"use client";
import { Checkbox, Modal, Select } from "antd";
import dayjs from "dayjs";
import { useFormik } from "formik";
import Button from "@/src/components/Button";
import Input from "@/src/components/Input";
import { useUploadFile } from "@/src/api/upload";
import { useConfirmEventsDropdown } from "@/src/api/dropdown";
import { EventsDropdownItem } from "@/src/types/types";

type UploadFormValues = {
  file: File | null;
  delete_after: string;
  event_id: number | undefined;
  general: boolean;
};

interface UploadFileModalProps {
  open: boolean;
  onClose: VoidFunction;
  /** Pre-selects an event, e.g. when uploading from a confirmed event. */
  defaultEventId?: number;
}

/** Shared "Upload File" popup — used by the File Upload page and by a
 *  confirmed event's Files section. */
const UploadFileModal = ({ open, onClose, defaultEventId }: UploadFileModalProps) => (
  // destroyOnHidden: every open starts from a clean form and file input.
  <Modal title="Upload File" open={open} onCancel={onClose} footer={null} destroyOnHidden>
    <UploadForm onClose={onClose} defaultEventId={defaultEventId} />
  </Modal>
);

const UploadForm = ({ onClose, defaultEventId }: Omit<UploadFileModalProps, "open">) => {
  const uploadMutation = useUploadFile();
  const { data: eventsDropdown } = useConfirmEventsDropdown();

  // Soonest event first — same ordering as confirmed-events' own event picker.
  const eventOptions = (eventsDropdown?.data as EventsDropdownItem[])
    ?.slice()
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    .map((item) => ({
      label: `${dayjs(item.date).format("DD/MM/YYYY")} - ${item.venues?.venue} (${item.users_events_user_idTousers?.name})`,
      value: item.id,
    }));

  const formik = useFormik<UploadFormValues>({
    initialValues: { file: null, event_id: defaultEventId, general: false, delete_after: "" },
    validateOnChange: true,
    validate: (values) => {
      const errors: Partial<Record<keyof UploadFormValues, string>> = {};
      if (!values.file) errors.file = "Please choose a file";
      if (!values.general && values.event_id == null) {
        errors.event_id = "Please select an event";
      }
      return errors;
    },
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("file", values.file as File);
      if (values.event_id !== undefined) formData.append("event_id", String(values.event_id));
      if (values.general) formData.append("general", "true");
      if (values.delete_after) {
        // API-friendly date (YYYY-MM-DD from native date input)
        formData.append("delete_after", dayjs(values.delete_after).format("YYYY-MM-DD"));
      }
      await uploadMutation.mutateAsync(formData);
      onClose();
    },
  });

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      <Input
        name="file"
        type="file"
        label="Choose file"
        // Native file inputs can't have their button text changed, but
        // flex/items-center keeps the "no file chosen" text vertically centred.
        className="flex items-center file:mr-3 file:h-full file:border-0 file:bg-secondary-200 file:px-3 file:text-sm file:text-gray-700 file:cursor-pointer"
        onChange={(e) => {
          formik.setFieldValue("file", e.currentTarget.files?.[0] ?? null);
        }}
        // No onBlur on purpose: a file input blurs the moment the OS picker
        // opens, which would flag "Please choose a file" before the user has
        // had a chance to choose. Formik still shows it on a real submit.
        error={formik.touched.file && formik.errors.file ? formik.errors.file : undefined}
      />
      <div>
        <label className="mb-1 block text-xs">Event</label>
        <Select
          className="w-full bg-secondary-100!"
          placeholder="Select event"
          options={eventOptions}
          allowClear
          disabled={formik.values.general}
          status={formik.touched.event_id && formik.errors.event_id ? "error" : undefined}
          value={formik.values.event_id}
          onChange={(value) => {
            formik.setFieldValue("event_id", value == null ? undefined : Number(value));
          }}
          onBlur={() => formik.setFieldTouched("event_id", true)}
        />
        {formik.touched.event_id && formik.errors.event_id ? (
          <p className="mt-1 text-xs text-red-500">{formik.errors.event_id}</p>
        ) : null}
      </div>
      <Input
        type="date"
        name="delete_after"
        label="Delete after"
        value={formik.values.delete_after}
        onChange={(e) => formik.setFieldValue("delete_after", e.target.value)}
        onBlur={formik.handleBlur}
      />
      <Checkbox
        checked={formik.values.general}
        onChange={(e) => {
          formik.setFieldValue("general", e.target.checked);
          if (e.target.checked) formik.setFieldValue("event_id", undefined);
        }}
      >
        General
      </Checkbox>
      <div className="flex justify-end gap-3">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          htmlType="submit"
          type="primary"
          loading={uploadMutation.isPending || formik.isSubmitting}
        >
          Upload
        </Button>
      </div>
    </form>
  );
};

export default UploadFileModal;
