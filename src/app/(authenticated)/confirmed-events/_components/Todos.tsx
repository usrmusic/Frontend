import { useDeleteTodo, useGetTodos } from "@/src/api/events";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { Spin } from "antd";
import { Check, CircleX } from "lucide-react";
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

  const { data, isLoading } = useGetTodos(Number(eventId));
  const deleteTodoMutation = useDeleteTodo();

  const handleYes = () => {
    deleteTodoMutation.mutate(
      {
        eventId: Number(eventId),
        todoId: Number(selectedRowKeys[0]),
      },
      {
        onSuccess: () => {
          setAlertModal(false);
        },
      },
    );
  };

  const columns = [
    {
      title: "Created By",
      dataIndex: "created_by",
      key: "created_by",
    },
    {
      title: "Assigned to",
      dataIndex: "assigned_to",
      key: "assigned_to",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      render: (text: string) =>
        text ? new Date(text).toLocaleDateString() : "",
    },
    {
      title: "Comment",
      dataIndex: "comment",
      key: "comment",
    },
    {
      title: "Complete",
      dataIndex: "complete",
      key: "complete",
      render: (value: boolean) =>
        value ? (
          <Check className="text-green-500" />
        ) : (
          <CircleX className="text-red-500" />
        ),
    },
  ];
  const handleCancel = () => {
    setModalOpen(false);
  };
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection: TableRowSelection = {
    type: "radio",
    selectedRowKeys,
    onChange: onSelectChange,
  };
  if (isLoading) {
    return <Spin />;
  }
  return (
    <>
      <div className="space-y-4">
        {isEditMode && (
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
            columns={columns}
            rowKey={(data) => data.id}
            rowSelection={rowSelection}
          />
        ) : (
          <>No Records found</>
        )}
      </div>
      {modalOpen && (
        <TodoModal open={modalOpen} onCancel={handleCancel} eventId={eventId} />
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
