"use client";
import { useUsersDropdown, useEquipmentDropdown } from "@/src/api/dropdown";
import { useAddPackage, useEditPackage, useGetPackage } from "@/src/api/usersApi";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, Select } from "antd";
import { useFormik } from "formik";
import { GripVertical, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

interface EquipmentLine {
  equipment_id: number | string;
  quantity: number | string;
}

interface PackageFormValues {
  id: number | string;
  user_id: number | string;
  package_name: string;
  cost_price: number | string;
  sell_price: number | string;
  equipments: EquipmentLine[];
}

interface PackageProps {
  modalOpen: boolean;
  handleCancel: VoidFunction;
  initialValues: PackageFormValues | null;
}

const PackageModal = ({ modalOpen, handleCancel, initialValues }: PackageProps) => {
  const isEdit = !!initialValues;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const { data: staffList, isLoading: staffLoading } = useUsersDropdown();
  const { data: equipmentData } = useEquipmentDropdown();
  const { data: packageDetail, isLoading: detailLoading } = useGetPackage(
    isEdit ? initialValues?.id : undefined,
  );

  const addPackage = useAddPackage();
  const editPackage = useEditPackage();
  const loading = addPackage.isPending || editPackage.isPending;

  const formik = useFormik<Omit<PackageFormValues, "id">>({
    initialValues: {
      package_name: initialValues?.package_name || "",
      user_id: initialValues?.user_id || "",
      cost_price: initialValues?.cost_price || "",
      sell_price: initialValues?.sell_price || "",
      equipments: [{ equipment_id: "", quantity: "" }],
    },
    enableReinitialize: false,
    onSubmit: (values) => {
      const payload = {
        ...values,
        cost_price: Number(values.cost_price),
        sell_price: Number(values.sell_price),
        user_id: Number(values.user_id),
        equipments: values.equipments
          .filter((item) => item.equipment_id && item.quantity)
          .map((item, idx) => ({
            equipment_id: Number(item.equipment_id),
            quantity: Number(item.quantity),
            equipment_order_id: idx + 1,
          })),
      };
      if (isEdit) {
        editPackage.mutate(
          { ...payload, id: initialValues!.id },
          {
            onSuccess: () => {
              handleCancel();
              toast.success("Package updated successfully");
            },
          },
        );
      } else {
        addPackage.mutate(payload, {
          onSuccess: () => {
            handleCancel();
            toast.success("Package added successfully");
          },
        });
      }
    },
  });

  // When editing: populate equipments from the fetched package detail
  useEffect(() => {
    if (!packageDetail) return;
    const lines: EquipmentLine[] = (packageDetail.package_user_equipment || []).map(
      (pue: { equipment_id: number | string; quantity: number | string }) => ({
        equipment_id: String(pue.equipment_id ?? ""),
        quantity: String(pue.quantity ?? ""),
      }),
    );
    formik.setFieldValue("equipments", lines.length ? lines : [{ equipment_id: "", quantity: "" }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageDetail]);

  // ── Drag-and-drop helpers ──
  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleDrop = (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...formik.values.equipments];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIdx, 0, moved);
    formik.setFieldValue("equipments", next);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const addLine = () =>
    formik.setFieldValue("equipments", [
      ...formik.values.equipments,
      { equipment_id: "", quantity: "" },
    ]);

  const removeLine = (idx: number) =>
    formik.setFieldValue(
      "equipments",
      formik.values.equipments.filter((_, i) => i !== idx),
    );

  const isDetailLoading = isEdit && detailLoading;

  return (
    <Modal
      open={modalOpen}
      onCancel={handleCancel}
      title={
        <span className="text-base font-semibold text-gray-900">
          {isEdit ? "Edit Package" : "Add Package"}
        </span>
      }
      footer={false}
      width={580}
      styles={{ body: { paddingTop: 8 } }}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-4">
          {/* Staff */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Staff</label>
            <Select
              className="w-full"
              loading={staffLoading}
              value={formik.values.user_id || undefined}
              onChange={(val) => formik.setFieldValue("user_id", val ?? "")}
              placeholder="Select Staff"
              options={staffList?.map((opt: { id: number | string; name: string }) => ({
                value: opt.id,
                label: opt.name,
              }))}
            />
          </div>

          {/* Package name */}
          <Input
            label="Package Name"
            name="package_name"
            value={formik.values.package_name}
            onChange={formik.handleChange}
          />

          {/* Cost / Sell price */}
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

          {/* Equipment list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Equipment</span>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Plus size={12} />
                Add Item
              </button>
            </div>

            {isDetailLoading ? (
              <div className="rounded-xl border border-secondary-200 bg-secondary-100/40 py-6 text-center text-xs text-gray-400">
                Loading equipment…
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-secondary-200 bg-secondary-100/30 p-2">
                {formik.values.equipments.map((item, idx) => {
                  const isDragging = dragIndex === idx;
                  const isOver = dragOverIndex === idx && dragIndex !== idx;
                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      className={[
                        "flex items-center gap-2 rounded-lg border bg-white px-2 py-2 transition-all",
                        isDragging ? "opacity-40 border-primary/40" : "border-secondary-200",
                        isOver ? "border-primary shadow-sm scale-[1.01]" : "",
                      ].join(" ")}
                    >
                      {/* Drag handle */}
                      <span className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0 active:cursor-grabbing">
                        <GripVertical size={16} />
                      </span>

                      {/* Equipment select */}
                      <Select
                        size="small"
                        className="flex-1"
                        value={item.equipment_id || undefined}
                        onChange={(val) =>
                          formik.setFieldValue(`equipments[${idx}].equipment_id`, val ?? "")
                        }
                        placeholder="Select Equipment"
                        options={equipmentData?.map((opt: { id: number | string; name: string }) => ({
                          value: opt.id,
                          label: opt.name,
                        }))}
                      />

                      {/* Quantity */}
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          formik.setFieldValue(
                            `equipments[${idx}].quantity`,
                            e.target.value,
                          )
                        }
                        className="w-16 h-8 rounded-lg px-2 text-xs bg-secondary-100 outline-none text-center"
                        style={{ backgroundColor: "var(--color-secondary-100)" }}
                      />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                        disabled={formik.values.equipments.length === 1}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}

                {formik.values.equipments.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">
                    No equipment added yet. Click &ldquo;Add Item&rdquo; to start.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
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
