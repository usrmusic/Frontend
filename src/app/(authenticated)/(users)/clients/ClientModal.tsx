import { useAddClient, useEditClient } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, notification } from "antd";
import { useFormik } from "formik";

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
      // Can handle differently for add/edit
      const payload = {
        ...values,
        role_id: "4",
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
    <Modal open={modalOpen} onCancel={onCancel} footer={false}>
      <form onSubmit={formik.handleSubmit}>
        <h1 className="text-2xl font-semibold mb-3">
          {isEditMode ? "Edit Client" : "Add Client"}
        </h1>
        <div className="grid grid-cols-2 gap-4">
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
          <Input
            required
            label="Event Date"
            name="event_date"
            type="date"
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
