"use client";
import { useDeleteUser, useUsers } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType } from "antd";
import { useState } from "react";
import UserModal from "./UserModal";
import { Pencil } from "lucide-react";
import { TableRowSelection } from "antd/es/table/interface";
import AlertModal from "@/src/components/common/AlertModal";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const UsersPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [userDataItem, setUserDataItem] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 1000);
  
  const { data: usersData, isLoading } = useUsers({
    ...params,
    page: debouncedSearch ? 1 : params.page,
    search: debouncedSearch,
  });
  const deleteUser = useDeleteUser();

  const handleCancel = () => {
    setUserDataItem(null);
    setModalOpen(false);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleDelete = () => {
    deleteUser.mutate(
      { ids: selectedRowKeys, force: false },
      {
        onSuccess: () => {
          setAlertModal(false);
          notification.success({
            message: "Success",
            description: "Package(s) deleted successfully.",
            placement: "topRight",
          });
        },
      },
    );
  };
  const columns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Contact Number",
      dataIndex: "contact_number",
      key: "contact_number",
    },
    {
      title: "Password",
      dataIndex: "password_text",
      key: "password",
    },
    {
      title: "Reset Password",
      dataIndex: "resetPassword",
      key: "resetPassword",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Role",
      dataIndex: "role.name",
      key: "role",
    },
    {
      title: "Action",
      fixed: "right",
      render: (data) => (
        <button
          onClick={() => {
            setModalOpen(true);
            setUserDataItem(data);
          }}
        >
          <Pencil size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Filters Card */}
      <Card variant="green">
        <div className="flex items-center justify-between">
          <div className="flex max-w-96.25 items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalOpen(true)}>Add</Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => setAlertModal(true)}
            >
              Remove
            </Button>
            <Button>Deleted Users</Button>
            <Button>Export Data</Button>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        rowSelection={rowSelection}
        dataSource={usersData?.data}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: usersData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        loading={isLoading}
        rowKey={(data) => data.id}
      />
      {modalOpen && (
        <UserModal
          handleCancel={handleCancel}
          initialValues={userDataItem}
          modalOpen={modalOpen}
        />
      )}
      {alertModal && (
        <AlertModal
          loading={deleteUser.isPending}
          onYes={handleDelete}
          open={alertModal}
          handleCancel={() => setAlertModal(false)}
          title="Delete User"
          text="Are you sure you want to delete user(s)?"
        />
      )}
    </div>
  );
};

export default UsersPage;
