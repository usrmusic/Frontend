import { useAddRole } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, notification } from "antd";
import { useFormik } from "formik";

interface RoleModalProps {
  modalOpen: boolean;
  handleCancel: VoidFunction;
}

const RoleModal = ({ modalOpen, handleCancel }: RoleModalProps) => {
  const addRole = useAddRole();

  const formik = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: (values) => {
      // TODO: handle form submit (e.g., call API to add role)
      // For now just close the modal or do nothing
      const payload = {
        ...values,
        guard_name: values.name.split(" ").join("_"),
      };
      addRole.mutate(payload, {
        onSuccess: () => {
          handleCancel();
          notification.success({
            message: "Success",
            description: "Role Successfully added",
          });
        },
      });
    },
  });
  return (
    <Modal open={modalOpen} onCancel={handleCancel} title="Add" footer={false}>
      <form onSubmit={formik.handleSubmit}>
        <Input
          label="Role Name"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          required
        />
        <div className="mt-4">
          <ModalFooter
            loading={addRole.isPending}
            onCancel={handleCancel}
            mode="add"
          />
        </div>
      </form>
    </Modal>
  );
};

export default RoleModal;
