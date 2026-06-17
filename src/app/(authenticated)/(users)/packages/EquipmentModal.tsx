import { useAddEquipment, useEditEquipment } from "@/src/api/usersApi";
import { useSupplierDropdown } from "@/src/api/dropdown";
import ModalFooter from "@/src/components/common/ModalFooter";
import Input from "@/src/components/Input";
import { Modal, Select } from "antd";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";

interface EquipmentProps {
  modalOpen: boolean;
  handleCancel: VoidFunction;
  initialValues: any | null;
}

const EquipmentModal = ({ modalOpen, handleCancel, initialValues }: EquipmentProps) => {
  const isEdit = !!initialValues;
  const addEquipment = useAddEquipment();
  const editEquipment = useEditEquipment();
  const loading = addEquipment.isPending || editEquipment.isPending;
  const { data: suppliers = [], isLoading: suppliersLoading } = useSupplierDropdown();
  const [showNewSupplier, setShowNewSupplier] = useState<boolean>(Boolean(initialValues?.supplier_name && !initialValues?.supplier_id));

  

  const formik = useFormik({
    initialValues: {
      name: initialValues?.name || "",
      is_availabilty_check: initialValues?.is_availabilty_check || false,
      cost_price: initialValues?.cost_price || "",
      sell_price: initialValues?.sell_price || "",
      quantity: initialValues?.quantity || "",
      supplier_id: initialValues?.supplier_id || "",
      pricing_guide: initialValues?.pricing_guide || "",
      supplier_name: initialValues?.supplier_name || "",
      rig_notes: initialValues?.rig_notes || "",
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const payload: any = {
        name: values.name,
        is_availabilty_check: !!values.is_availabilty_check,
        pricing_guide: values.pricing_guide || null,
        rig_notes: values.rig_notes || null,
      };

      // Enforce availability rules:
      // - If availability is unchecked -> quantity = 0
      // - If availability is checked -> cost_price and sell_price = 0
      if (values.is_availabilty_check) {
        payload.quantity = values.quantity !== "" ? Number(values.quantity) : 0;
        payload.cost_price = 0;
        payload.sell_price = 0;
      } else {
        payload.quantity = 0;
        payload.cost_price = values.cost_price !== "" ? Number(values.cost_price) : 0;
        payload.sell_price = values.sell_price !== "" ? Number(values.sell_price) : 0;
      }

      // supplier preference: supplier_id if set, else supplier_name if provided
      if (values.supplier_id) payload.supplier_id = Number(values.supplier_id);
      else if (values.supplier_name) payload.supplier_name = values.supplier_name;
      if (isEdit) {
        editEquipment.mutate({ ...payload, id: initialValues.id }, {
          onSuccess: () => {
            handleCancel();
            toast.success("Equipment successfully updated");
          }
        });
      } else {
        addEquipment.mutate(payload, {
          onSuccess: () => {
            handleCancel();
            toast.success("Equipment successfully added");
          }
        });
      }
    },
  });

  useEffect(() => {
    // Reset form and supplier toggle when modal opens or initialValues change
    const initValues = {
      name: initialValues?.name || "",
      is_availabilty_check: initialValues?.is_availabilty_check || false,
      cost_price: initialValues?.cost_price || "",
      sell_price: initialValues?.sell_price || "",
      quantity: initialValues?.quantity || "",
      supplier_id: initialValues?.supplier_id || "",
      pricing_guide: initialValues?.pricing_guide || "",
      supplier_name: initialValues?.supplier_name || "",
      rig_notes: initialValues?.rig_notes || "",
    };

    if (modalOpen) {
      formik.resetForm({ values: initValues });
      setShowNewSupplier(Boolean(initialValues?.supplier_name && !initialValues?.supplier_id));
    } else {
      // closing modal: clear form state and supplier toggle
      formik.resetForm();
      setShowNewSupplier(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, initialValues]);

  useEffect(() => {
    // If user chooses to add a new supplier, clear any selected supplier_id so backend will create a new supplier
    if (showNewSupplier) {
      formik.setFieldValue('supplier_id', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewSupplier]);

  return (
    <Modal open={modalOpen} onCancel={handleCancel} title={isEdit ? "Edit Equipment" : "Add Equipment"} footer={false}>
      <form onSubmit={formik.handleSubmit}>
            <div className="space-y-4">
              <Input label="Name" name="name" value={formik.values.name} onChange={formik.handleChange} required />

              <div className="flex items-center gap-2">
                <input
                  id="is_availabilty_check"
                  name="is_availabilty_check"
                  type="checkbox"
                  className="w-4 h-4 rounded-sm accent-primary border-gray-300"
                  checked={formik.values.is_availabilty_check}
                  onChange={(e) => formik.setFieldValue('is_availabilty_check', e.target.checked)}
                />
                <label htmlFor="is_availabilty_check" className="mb-1 text-xs flex items-center gap-1">Do you have this Equipment? *</label>
              </div>

              {!formik.values.is_availabilty_check && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Cost Price" type="number" name="cost_price" value={formik.values.cost_price} onChange={formik.handleChange} />
                  <Input label="Sell Price" type="number" name="sell_price" value={formik.values.sell_price} onChange={formik.handleChange} required />
                </div>
              )}

              {formik.values.is_availabilty_check && (
                <Input label="Quantity" type="number" name="quantity" value={formik.values.quantity} onChange={formik.handleChange} />
              )}

              {/* Status removed per requirements */}

              <div>
                <label className="mb-1 text-xs">Supplier</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-primary text-white text-sm hover:opacity-95"
                    onClick={() => setShowNewSupplier(true)}
                  >
                    Add new supplier
                  </button>
                  {!showNewSupplier && (
                    <Select
                      className="flex-1"
                      loading={suppliersLoading}
                      value={formik.values.supplier_id || undefined}
                      onChange={(val) => formik.setFieldValue("supplier_id", val ?? "")}
                      placeholder="Select Supplier"
                      options={Array.isArray(suppliers) ? suppliers.map((s: any) => ({
                        value: s.id,
                        label: s.company_name || s.name,
                      })) : []}
                    />
                  )}
                </div>
                <div className="mt-2">
                  {showNewSupplier ? (
                    <div className="flex gap-2">
                      <input
                        className="w-full h-10 rounded-xl px-3 text-sm bg-secondary-100"
                        name="supplier_name"
                        value={formik.values.supplier_name}
                        onChange={formik.handleChange}
                        placeholder="New supplier name"
                      />
                      <button type="button" className="px-3 py-1 rounded-lg bg-secondary-200 text-sm" onClick={() => { setShowNewSupplier(false); formik.setFieldValue('supplier_name', ''); }}>
                        Select existing
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Or click "Add new supplier" to add a new one</div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 text-xs">Pricing Guide</label>
                <textarea
                  className="w-full rounded-xl px-3 text-sm bg-secondary-100 h-24 p-2"
                  name="pricing_guide"
                  value={(formik.values as any).pricing_guide || ''}
                  onChange={formik.handleChange}
                />
              </div>

              <div>
                <label className="mb-1 text-xs">Rig Notes</label>
                <textarea
                  className="w-full rounded-xl px-3 text-sm bg-secondary-100 h-24 p-2"
                  name="rig_notes"
                  value={formik.values.rig_notes}
                  onChange={formik.handleChange}
                />
              </div>
            </div>
        <div className="mt-4">
          <ModalFooter loading={loading} mode={isEdit ? "edit" : "add"} onCancel={handleCancel} />
        </div>
      </form>
    </Modal>
  );
};

export default EquipmentModal;
