import { useRoleDropdown } from "@/src/api/dropdown";
import { useAddUser, useEditUser } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { ColorPicker, Modal, notification, Select } from "antd";
import { useFormik } from "formik";

interface UserData {
  id: string | number;
  name: string;
  email: string;
  contact_number: string;
  address: string;
  role_id: string;
  is_email_send: boolean;
  color?: string | null;
}

// Colour only makes sense for roles that can actually be assigned as an
// event's DJ — Staff (3) and Admin (2, since an admin can also be set as
// dj_id — see backend's dj-colors roster query). Super Admin/Client never are.
const DJ_ELIGIBLE_ROLES = ["2", "3"];

interface UserModalProps {
  modalOpen: boolean;
  handleCancel: VoidFunction;
  initialValues: UserData | null;
}

const UserModal = ({
  modalOpen,
  handleCancel,
  initialValues,
}: UserModalProps) => {
  const isEditMode = !!initialValues;
  const addUser = useAddUser();
  const editUser = useEditUser();
  const loading = addUser.isPending || editUser.isPending;

  const formik = useFormik({
    initialValues: {
      name: initialValues?.name || "",
      email: initialValues?.email || "",
      contact_number: initialValues?.contact_number || "",
      address: initialValues?.address || "",
      role_id: initialValues?.role_id || "",
      sendEmail: initialValues?.is_email_send || false,
      color: initialValues?.color || "",
    },
    onSubmit: (values) => {
      // handle submit logic here
      // you may want to pass `values` to parent handler or do something else
      console.log(values);
      if (isEditMode) {
        editUser.mutate(
          { ...values, id: initialValues.id },
          {
            onSuccess: () => {
              handleCancel();
              notification.success({
                message: "Success",
                description: "User Successfully updated",
              });
            },
          },
        );
      } else {
        addUser.mutate(values, {
          onSuccess: () => {
            handleCancel();
            notification.success({
              message: "Success",
              description: "User Successfully added",
            });
          },
        });
      }
    },
    enableReinitialize: true,
  });
  const { data: roleData, isLoading } = useRoleDropdown();

  return (
    <Modal
      open={modalOpen}
      onCancel={handleCancel}
      title={isEditMode ? "Edit User" : "Add User"}
      footer={false}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            label="Email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            label="Contact Number"
            name="contact_number"
            value={formik.values.contact_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <Input
            label="Address"
            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <div className="flex flex-col">
            <label>Role</label>
            <Select
              placeholder="Select Role"
              disabled={isLoading}
              className="bg-secondary-100!"
              loading={isLoading}
              value={formik.values.role_id || undefined}
              onChange={(value) => formik.setFieldValue("role_id", value)}
              options={roleData?.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />
          </div>
          <div className="flex flex-col">
            <label>Send Email</label>
            <Select
              value={formik.values.sendEmail}
              className="bg-secondary-100!"
              onChange={(value) => formik.setFieldValue("sendEmail", value)}
              options={[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ]}
            />
          </div>
          {DJ_ELIGIBLE_ROLES.includes(String(formik.values.role_id)) && (
            <div className="flex flex-col">
              <label>Calendar Colour</label>
              <div className="flex items-center gap-2 h-8">
                <ColorPicker
                  value={formik.values.color || "#9CA3AF"}
                  onChangeComplete={(c) => formik.setFieldValue("color", c.toHexString())}
                />
                <span className="text-xs text-gray-500 font-mono">
                  {formik.values.color || "Not set (grey)"}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <ModalFooter
            loading={loading}
            mode={isEditMode ? "edit" : "add"}
            onCancel={handleCancel}
          />
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
