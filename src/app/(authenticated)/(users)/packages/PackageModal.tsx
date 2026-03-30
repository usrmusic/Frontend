import { useUsersDropdown, useEquipmentDropdown } from "@/src/api/dropdown";
import { useAddPackage, useEditPackage } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal } from "antd";
import { useFormik } from "formik";
import { Trash } from "lucide-react";
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
  equipments: {
    equipment_id: number | string;
    quantity: number | string;
  }[];
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
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipmentDropdown();
  const addPackage = useAddPackage();
  const editPackage = useEditPackage();
  const loading = addPackage.isPending || editPackage.isPending;
  const formik = useFormik({
    initialValues: {
      package_name: initialValues?.package_name || "",
      user_id: initialValues?.user_id || "",
      cost_price: initialValues?.cost_price || "",
      sell_price: initialValues?.sell_price || "",
      equipments: (initialValues as PackageFormValues | null)?.equipments
        ?.length
        ? (initialValues as PackageFormValues).equipments
        : [{ equipment_id: "", quantity: "" }],
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const payload = {
        ...values,
        cost_price: Number(values.cost_price),
        sell_price: Number(values.sell_price),
        user_id: Number(values.user_id),
        equipments: values.equipments
          .filter((item) => item.equipment_id && item.quantity)
          .map((item) => ({
            equipment_id: Number(item.equipment_id),
            quantity: Number(item.quantity),
          })),
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
            <label className="mb-1 text-xs flex items-center gap-1">
              Staff
            </label>
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
          <div>
            <label className="mb-1 text-xs flex items-center gap-1">
              Select Equipments
            </label>
            <div className="space-y-3">
              {formik.values.equipments?.map((item, index) => (
                <div className="flex gap-3" key={index}>
                  <select
                    className="w-full h-10 rounded-xl px-3 text-sm bg-secondary-100"
                    value={item.equipment_id}
                    onChange={(e) =>
                      formik.setFieldValue(
                        `equipments[${index}].equipment_id`,
                        e.target.value,
                      )
                    }
                  >
                    <option value="">Select Equipment</option>
                    {equipmentData?.map((opt: any) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    label=""
                    type="number"
                    name={`equipments[${index}].quantity`}
                    value={item.quantity}
                    onChange={formik.handleChange}
                    placeholder="Quantity"
                  />
                  {formik.values.equipments.length > 1 && (
                    <button
                      type="button"
                      className="text-sm font-medium text-red-500 col-span-2 text-left"
                      onClick={() =>
                        formik.setFieldValue(
                          "equipments",
                          formik.values.equipments.filter(
                            (_, i) => i !== index,
                          ),
                        )
                      }
                    >
                      <Trash size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                className="text-sm font-medium text-primary"
                type="button"
                onClick={() =>
                  formik.setFieldValue("equipments", [
                    ...formik.values.equipments,
                    { equipment_id: "", quantity: "" },
                  ])
                }
              >
                + Add another equipment
              </button>
            </div>
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
