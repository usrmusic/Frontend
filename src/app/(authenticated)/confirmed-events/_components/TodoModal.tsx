import Input from "@/src/components/Input";
import ModalFooter from "@/src/components/common/ModalFooter";
import { Checkbox, Modal, Select } from "antd";
import { useFormik } from "formik";
import React from "react";
import { toast } from "react-toastify";
import { useAddTodo, useUpdateTodo } from "@/src/api/events";
import { useUsersDropdown } from "@/src/api/dropdown";

interface CompoProps {
  open: boolean;
  onCancel: VoidFunction;
  eventId: string;
  initialValues?: Partial<TodoFormValues> | null;
  todoId?: number | null;
}

export interface TodoFormValues {
  assigned_to: string;
  action: string;
  deadline: string;
  comment: string;
  complete: boolean;
}

const TodoModal = ({
  open,
  onCancel,
  eventId,
  initialValues,
  todoId,
}: CompoProps) => {
  const isEdit = !!todoId;
  const addTodo = useAddTodo();
  const updateTodo = useUpdateTodo();
  const { data } = useUsersDropdown();

  const formik = useFormik<TodoFormValues>({
    enableReinitialize: true,
    initialValues: {
      assigned_to: initialValues?.assigned_to ? String(initialValues.assigned_to) : "",
      action: initialValues?.action ?? "",
      deadline: initialValues?.deadline ?? "",
      comment: initialValues?.comment ?? "",
      complete: initialValues?.complete ?? false,
    },
    onSubmit: (values, { resetForm }) => {
      if (isEdit && todoId) {
        updateTodo.mutate(
          { eventId: Number(eventId), todoId, payload: values },
          {
            onSuccess: () => {
              toast.success("Todo updated successfully");
              resetForm();
              onCancel();
            },
          },
        );
      } else {
        addTodo.mutate(
          { eventId: Number(eventId), payload: values },
          {
            onSuccess: () => {
              toast.success("Todo added successfully");
              resetForm();
              onCancel();
            },
          },
        );
      }
    },
  });

  return (
    <Modal
      open={open}
      footer={false}
      title={isEdit ? "Edit Todo" : "Add Todo"}
      onCancel={onCancel}
    >
      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 text-xs flex items-center gap-1">
              Assigned To
            </label>
            <Select
              className="w-full bg-secondary-100!"
              placeholder="Select User"
              value={formik.values.assigned_to || undefined}
              onChange={(value) =>
                formik.setFieldValue("assigned_to", String(value))
              }
              options={data?.map((user) => ({
                value: String(user.id),
                label: user.name,
              }))}
            />
          </div>
          <Input
            label="Action"
            name="action"
            value={formik.values.action}
            onChange={formik.handleChange}
          />
          <Input
            label="Deadline"
            type="date"
            name="deadline"
            value={formik.values.deadline}
            onChange={formik.handleChange}
          />
          <div>
            <label className="mb-1 text-xs flex items-center gap-1">
              Comment
            </label>
            <textarea
              name="comment"
              rows={4}
              value={formik.values.comment}
              onChange={formik.handleChange}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 outline-none"
            />
          </div>
          <Checkbox
            checked={formik.values.complete}
            onChange={(e) => formik.setFieldValue("complete", e.target.checked)}
          >
            Complete
          </Checkbox>
        </div>
        <div className="mt-4">
          <ModalFooter
            mode={isEdit ? "edit" : "add"}
            onCancel={onCancel}
            loading={addTodo.isPending || updateTodo.isPending}
          />
        </div>
      </form>
    </Modal>
  );
};

export default TodoModal;
