import { useAddClient, useEditClient } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, notification } from "antd";
import { useFormik } from "formik";
import dayjs from "dayjs";

interface ClientData {
  id: number | string;
  name: string;
  email: string;
  address: string;
  event_date: string;
  contact_number: string;
}

interface ClientModalProps {
  modalOpen: boolean;
  onCancel: VoidFunction;
  initialValues: ClientData | null;
}

const getInitialValues = (client: ClientData | null) => ({
  name: client?.name || "",
  email: client?.email || "",
  address: client?.address || "",
  event_date: client?.event_date || "",
  contact_number: client?.contact_number || "",
});

const ClientModal = ({
  modalOpen,
  onCancel,
  initialValues,
}: ClientModalProps) => {
  const isEditMode = !!initialValues;
  const addClient = useAddClient();
  const editClient = useEditClient();
  const loading = addClient.isPending || editClient.isPending;
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialValues(initialValues),
    onSubmit: (values) => {
      // Event date is optional; when adding a client it creates their first
      // open enquiry. A blank one is left out of the request rather than sent
      // as "". (On edit the backend accepts and ignores it, as Laravel did.)
      const { event_date, ...clientFields } = values;
      const payload = {
        ...clientFields,
        role_id: "4",
        ...(event_date ? { event_date } : {}),
      };
      if (isEditMode) {
        // Edit logic here
        editClient.mutate(
          {
            ...payload,
            id: initialValues.id,
          },
          {
            onSuccess: () => {
              onCancel();
              notification.success({
                message: "Success",
                description: "Client Successfully updated",
              });
            },
          },
        );
      } else {
        // Add logic here
        addClient.mutate(payload, {
          onSuccess: () => {
            onCancel();
            notification.success({
              message: "Success",
              description: "Client Successfully added",
            });
          },
        });
      }
    },
  });

  return (
    <Modal
      title={isEditMode ? "Edit Client" : "Add Client"}
      open={modalOpen}
      onCancel={onCancel}
      footer={false}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            required
            label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            required
            label="Email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {/* Shown when adding AND editing, as in Laravel's client form.
              Optional; the today-or-later limit only applies when adding,
              where it creates the client's first open enquiry. */}
          <Input
            label={isEditMode ? "Event Date" : "Event Date (optional)"}
            name="event_date"
            type="date"
            min={isEditMode ? undefined : dayjs().format("YYYY-MM-DD")}
            value={formik.values.event_date}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            required
            label="Contact Number"
            name="contact_number"
            value={formik.values.contact_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            required
            label="Address"
            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </div>
        <div className="mt-4">
          <ModalFooter
            mode={isEditMode ? "edit" : "add"}
            onCancel={onCancel}
            loading={loading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ClientModal;
