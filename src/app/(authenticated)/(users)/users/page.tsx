"use client";
import {
  useDeleteUser,
  useResetUserPassword,
  useUsers,
} from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType } from "antd";
import { useState } from "react";
import UserModal from "./UserModal";
import { KeyRound, Pencil } from "lucide-react";
import { TableRowSelection } from "antd/es/table/interface";
import AlertModal from "@/src/components/common/AlertModal";
import { CSVLink } from "react-csv";

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
  const [resetTarget, setResetTarget] = useState<
    { id: number | string; email: string } | null
  >(null);
  const debouncedSearch = useDebounce(search, 1000);

  const { data: usersData, isLoading } = useUsers({
    ...params,
    page: debouncedSearch ? 1 : params.page,
    search: debouncedSearch,
  });
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();

  const handleConfirmReset = () => {
    if (!resetTarget) return;
    resetPassword.mutate(resetTarget.id, {
      onSuccess: () => {
        notification.success({
          message: "Password reset",
          description: `A new password has been emailed to ${resetTarget.email}.`,
          placement: "topRight",
        });
        setResetTarget(null);
      },
    });
  };

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
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Role",
      key: "role",
      render: (_v, record) => {
        const r = record as { role?: string | null; roles?: { name?: string | null } | null };
        return r?.roles?.name || r?.role || "—";
      },
    },
    {
      title: "Action",
      fixed: "right",
      render: (data) => (
        <div className="flex items-center gap-2">
          <button
            title="Edit"
            onClick={() => {
              setModalOpen(true);
              setUserDataItem(data);
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            title="Reset password & email"
            onClick={() => {
              setResetTarget({
                id: (data as { id: number | string }).id,
                email: (data as { email: string }).email,
              });
            }}
          >
            <KeyRound size={14} />
          </button>
        </div>
      ),
    },
  ];
  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Contact Number", key: "contact_number" },
    { label: "Password", key: "password" },
    { label: "Address", key: "address" },
  ];
  const csvData = usersData?.data.map((user) => ({
    name: user.name,
    email: user.email,
    contact_number: user.contact_number,
    password: user.password_text,
    address: user.address,
  }));


  return (
    <div className="space-y-4 mt-4">
      {/* Filters Card */}
      <Card variant="green">
        <div className="flex items-center justify-between">
          <div className="flex w-[300px] items-center gap-2 rounded-lg bg-white px-4 h-10">
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
            <CSVLink
              data={csvData ?? []}
              filename="users.csv"
              headers={csvHeaders}
            >
              <Button>Export Data</Button>
            </CSVLink>
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
      {resetTarget && (
        <AlertModal
          loading={resetPassword.isPending}
          onYes={handleConfirmReset}
          open={!!resetTarget}
          handleCancel={() => setResetTarget(null)}
          title="Reset password"
          text={`This will generate a new password for ${resetTarget.email} and email it to them. Continue?`}
        />
      )}
    </div>
  );
};

export default UsersPage;
