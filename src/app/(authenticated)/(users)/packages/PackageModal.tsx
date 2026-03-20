import { useUsersDropdown } from "@/src/api/dropdown";
import { useAddPackage, useEditPackage } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, notification } from "antd";
import { useFormik } from "formik";
import { toast } from "react-toastify";

interface PackageProps {
  modalOpen: boolean;
  handleCancel: VoidFunction;
}

interface PackageFormValues {
  id: number | string;
  user_id: number | string;
  package_name: string;
  cost_price: number | string;
  sell_price: number | string;
}

interface PackageProps {
  modalOpen: boolean;
  handleCancel: VoidFunction;
  initialValues: PackageFormValues | null;
}

const PackageModal = ({
  modalOpen,
  handleCancel,
  initialValues,
}: PackageProps) => {
  const isEdit = !!initialValues;

  const { data, isLoading } = useUsersDropdown();
  const addPackage = useAddPackage();
  const editPackage = useEditPackage();
  const loading = addPackage.isPending || editPackage.isPending;
  const formik = useFormik({
    initialValues: {
      package_name: initialValues?.package_name || "",
      user_id: initialValues?.user_id || "",
      cost_price: initialValues?.cost_price || "",
      sell_price: initialValues?.sell_price || "",
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const payload = {
        ...values,
        cost_price: Number(values.cost_price),
        sell_price: Number(values.sell_price),
        user_id: Number(values.user_id),
      };
      if (isEdit) {
        editPackage.mutate(
          { ...payload, id: initialValues.id },
          {
            onSuccess: () => {
              handleCancel();
              toast.success("Package Successfully updated");
            },
          },
        );
      } else {
        addPackage.mutate(payload, {
          onSuccess: () => {
            handleCancel();
            toast.success("Package Successfully added");
          },
        });
      }
    },
  });

  return (
    <Modal
      open={modalOpen}
      onCancel={handleCancel}
      title={isEdit ? "Edit Package" : "Add Package"}
      footer={false}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Staff</label>
            <select
              className="w-full h-10 rounded-xl px-3 text-sm bg-secondary-100"
              name="user_id"
              disabled={isLoading}
              value={formik.values.user_id}
              onChange={formik.handleChange}
            >
              <option value="">Select Staff</option>
              {data?.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Package Name"
            name="package_name"
            value={formik.values.package_name}
            onChange={formik.handleChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Price"
              type="number"
              name="cost_price"
              value={formik.values.cost_price}
              onChange={formik.handleChange}
            />
            <Input
              label="Sell Price"
              type="number"
              name="sell_price"
              value={formik.values.sell_price}
              onChange={formik.handleChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <ModalFooter
            loading={loading}
            mode={isEdit ? "edit" : "add"}
            onCancel={handleCancel}
          />
        </div>
      </form>
    </Modal>
  );
};

export default PackageModal;
