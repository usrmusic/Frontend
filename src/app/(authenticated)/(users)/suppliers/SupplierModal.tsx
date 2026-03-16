import { useAddSupplier, useEditSupplier } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, notification } from "antd";
import { useFormik } from "formik";

interface SupplierData {
  id?: number | string;
  name: string;
  company_name: string;
  email: string;
  contact_number: string;
  industry: string;
  notes: string;
}

interface SupplierModalProps {
  modalOpen: boolean;
  onCancel: VoidFunction;
  initialValues: SupplierData | null;
}

const getInitialValues = (supplier: SupplierData | null): SupplierData => ({
  name: supplier?.name || "",
  company_name: supplier?.company_name || "",
  email: supplier?.email || "",
  contact_number: supplier?.contact_number || "",
  industry: supplier?.industry || "",
  notes: supplier?.notes || "",
});

const SupplierModal = ({
  modalOpen,
  onCancel,
  initialValues,
}: SupplierModalProps) => {
  const isEditMode = !!initialValues;
  const addSupplier = useAddSupplier();
  const editSupplier = useEditSupplier();
  const loading = addSupplier.isPending || editSupplier.isPending;

  const formik = useFormik<SupplierData>({
    enableReinitialize: true,
    initialValues: getInitialValues(initialValues),
    onSubmit: (values) => {
      // handle submit for add/edit, e.g., call mutate or API here
      // You can differentiate using isEditMode
      // For now, just close the modal
      if (isEditMode) {
        editSupplier.mutate(
          { ...values, id: initialValues.id ?? "" },
          {
            onSuccess: () => {
              onCancel();
              notification.success({
                message: "Success",
                description: "Supplier Successfully updated",
              });
            },
          },
        );
      } else {
        addSupplier.mutate(values, {
          onSuccess: () => {
            onCancel();
            notification.success({
              message: "Success",
              description: "Supplier Successfully added",
            });
          },
        });
      }
    },
  });

  return (
    <Modal
      open={modalOpen}
      onCancel={onCancel}
      title={isEditMode ? "Edit Supplier" : "Add Supplier"}
      footer={false}
    >
      <form onSubmit={formik.handleSubmit}>
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
            label="Company Name"
            name="company_name"
            value={formik.values.company_name}
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
            label="Mobile"
            name="contact_number"
            value={formik.values.contact_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            label="Industry"
            name="industry"
            value={formik.values.industry}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            label="Notes"
            name="notes"
            value={formik.values.notes}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </div>
        <div className="mt-4">
          <ModalFooter
            loading={loading}
            mode={isEditMode ? "edit" : "add"}
            onCancel={onCancel}
          />
        </div>
      </form>
    </Modal>
  );
};

export default SupplierModal;
