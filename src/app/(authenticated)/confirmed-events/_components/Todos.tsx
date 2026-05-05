import {
  TodoRespI,
  useDeleteTodo,
  useGetTodos,
  useToggleTodoComplete,
} from "@/src/api/events";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { useRole } from "@/src/hooks/useRole";
import { Checkbox, Spin } from "antd";
import { Pencil } from "lucide-react";
import { useState } from "react";
import TodoModal from "./TodoModal";
import AlertModal from "@/src/components/common/AlertModal";
import { TableRowSelection } from "antd/es/table/interface";

const Todos = ({
  isEditMode,
  eventId,
}: {
  isEditMode: boolean;
  eventId: string;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editTodo, setEditTodo] = useState<TodoRespI | null>(null);

  const { isAdmin, userId } = useRole();
  const { data, isLoading } = useGetTodos(Number(eventId));
  const deleteTodoMutation = useDeleteTodo();
  const toggleComplete = useToggleTodoComplete();

  const handleYes = () => {
    deleteTodoMutation.mutate(
      {
        eventId: Number(eventId),
        todoId: Number(selectedRowKeys[0]),
      },
      {
        onSuccess: () => {
          setAlertModal(false);
          setSelectedRowKeys([]);
        },
      },
    );
  };

  const canToggle = (record: TodoRespI) =>
    isAdmin ||
    (record.assigned_to != null &&
      userId != null &&
      Number(record.assigned_to) === Number(userId));

  const baseColumns = [
    {
      title: "Assigned to",
      dataIndex: "assigned_to",
      key: "assigned_to",
      render: (_: any, record: TodoRespI) =>
        (record as any)?.assigned_user_name || (record as any)?.users_todos_assigned_toTousers?.name || record.assigned_to || "-",
    },
    { title: "Action", dataIndex: "action", key: "action" },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      render: (text: string) =>
        text ? new Date(text).toLocaleDateString() : "",
    },
    { title: "Comment", dataIndex: "comment", key: "comment" },
    {
      title: "Complete",
      dataIndex: "complete",
      key: "complete",
      render: (value: boolean, record: TodoRespI) => (
        <Checkbox
          checked={!!value}
          disabled={!canToggle(record) || toggleComplete.isPending}
          onChange={(e) =>
            toggleComplete.mutate({
              eventId: Number(eventId),
              todoId: Number(record.id),
              complete: e.target.checked,
            })
          }
        />
      ),
    },
  ];

  const adminColumns = isAdmin
    ? [
        ...baseColumns,
        {
          title: "",
          key: "edit",
          render: (_: unknown, record: TodoRespI) => (
            <button
              type="button"
              className="text-gray-500 hover:text-gray-800"
              onClick={() => {
                setEditTodo(record);
                setModalOpen(true);
              }}
              aria-label="Edit todo"
            >
              <Pencil size={14} />
            </button>
          ),
        },
      ]
    : baseColumns;

  const handleCancel = () => {
    setModalOpen(false);
    setEditTodo(null);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<TodoRespI> | undefined = isAdmin
    ? {
        type: "radio",
        selectedRowKeys,
        onChange: onSelectChange,
      }
    : undefined;

  if (isLoading) {
    return <Spin />;
  }

  return (
    <>
      <div className="space-y-4">
        {isAdmin && isEditMode && (
          <div className="flex justify-end gap-3">
            <Button onClick={() => setModalOpen(true)}>Add</Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => setAlertModal(true)}
              type="primary"
            >
              Remove
            </Button>
          </div>
        )}
        {data && data.length > 0 ? (
          <DataTable
            dataSource={data}
            columns={adminColumns}
            rowKey={(data) => data.id}
            rowSelection={rowSelection}
          />
        ) : (
          <>No Records found</>
        )}
      </div>
      {modalOpen && (
        <TodoModal
          open={modalOpen}
          onCancel={handleCancel}
          eventId={eventId}
          initialValues={
            editTodo
              ? {
                  assigned_to:
                    editTodo.assigned_to != null
                      ? String(editTodo.assigned_to)
                      : "",
                  action: editTodo.action ?? "",
                  deadline: editTodo.deadline
                    ? String(editTodo.deadline).slice(0, 10)
                    : "",
                  comment: editTodo.comment ?? "",
                  complete: !!editTodo.complete,
                }
              : null
          }
          todoId={editTodo?.id ?? null}
        />
      )}
      {alertModal && (
        <AlertModal
          handleCancel={() => setAlertModal(false)}
          onYes={handleYes}
          open={alertModal}
          text="Are you sure you want to delete this todo?"
          title="Delete Todo"
          loading={deleteTodoMutation.isPending}
        />
      )}
    </>
  );
};

export default Todos;
