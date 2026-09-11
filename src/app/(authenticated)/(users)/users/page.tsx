"use client";
import {
  useDeleteUser,
  useResetUserPassword,
  useRestoreUsers,
  useUsers,
} from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType, TableProps } from "antd";
import { useState } from "react";
import UserModal from "./UserModal";
import { KeyRound, Pencil, RotateCcw } from "lucide-react";
import { TableRowSelection, SorterResult } from "antd/es/table/interface";
import AlertModal from "@/src/components/common/AlertModal";
import { CSVLink } from "react-csv";

const initialParams: {
  page: number;
  perPage: number;
  search: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
} = {
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
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<
    { id: number | string; name: string } | null
  >(null);
  const debouncedSearch = useDebounce(search, 1000);

  const { data: usersData, isLoading } = useUsers({
    ...params,
    page: debouncedSearch ? 1 : params.page,
    search: debouncedSearch,
    status: showDeactivated ? "inactive" : undefined,
  });
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();
  const restoreUsers = useRestoreUsers();

  const handleConfirmRestore = () => {
    if (!restoreTarget) return;
    restoreUsers.mutate(
      { ids: [restoreTarget.id] },
      {
        onSuccess: () => {
          notification.success({
            message: "User restored",
            description: `${restoreTarget.name} is active again.`,
            placement: "topRight",
          });
          setRestoreTarget(null);
        },
      },
    );
  };

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

  const handleTableChange: TableProps<any>["onChange"] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : (sorter as SorterResult<any>);
    setParams((p) => ({
      ...p,
      sort_by: s?.order && typeof s.field === "string" ? s.field : undefined,
      sort_dir: s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : undefined,
    }));
  };

  const handleDelete = () => {
    deleteUser.mutate(
      { ids: selectedRowKeys, force: showDeactivated },
      {
        onSuccess: (data: { count?: number; blocked?: { id: number | string; reason?: string }[] }) => {
          setAlertModal(false);
          const count = data?.count ?? 0;
          const blocked = data?.blocked ?? [];
          if (count > 0) {
            notification.success({
              message: "Success",
              description: showDeactivated
                ? `${count} user(s) permanently deleted.`
                : `${count} user(s) deactivated successfully.`,
              placement: "topRight",
            });
          }
          if (blocked.length > 0) {
            notification.warning({
              message: "Some users were not deleted",
              description: `${blocked.length} user(s) have an associated event or DJ package and were skipped.`,
              placement: "topRight",
            });
          }
          setSelectedRowKeys([]);
        },
      },
    );
  };
  const columns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: "Contact Number",
      dataIndex: "contact_number",
      key: "contact_number",
      sorter: true,
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
      sorter: true,
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
      title: "Status",
      dataIndex: "deleted_at",
      key: "status",
      render: (value: string | null) => (
        <span
          className={`whitespace-nowrap px-2 py-1 rounded-full text-xs ${
            value ? "text-red-700 bg-red-100" : "text-green-700 bg-green-100"
          }`}
        >
          {value ? "Deactivated" : "Active"}
        </span>
      ),
    },
    {
      title: "Colour",
      key: "color",
      render: (_v, record) => {
        const color = (record as { color?: string | null }).color;
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-4 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: color || "#9CA3AF" }}
              title={color || "Not set"}
            />
            <span className="text-xs text-gray-500 font-mono">{color || "—"}</span>
          </div>
        );
      },
    },
    {
      title: "Action",
      fixed: "right",
      render: (data) => {
        const row = data as { id: number | string; name: string; email: string; deleted_at: string | null };
        if (row.deleted_at) {
          return (
            <button
              title="Reactivate"
              onClick={() => setRestoreTarget({ id: row.id, name: row.name })}
            >
              <RotateCcw size={14} />
            </button>
          );
        }
        return (
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
              onClick={() => setResetTarget({ id: row.id, email: row.email })}
            >
              <KeyRound size={14} />
            </button>
          </div>
        );
      },
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
            <Button
              onClick={() => {
                setShowDeactivated((v) => !v);
                setParams((p) => ({ ...p, page: 1 }));
              }}
            >
              {showDeactivated ? "Show Active" : "Show Deactivated"}
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
        onChange={handleTableChange}
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
          title={showDeactivated ? "Delete User Permanently" : "Delete User"}
          text={
            showDeactivated
              ? "This will permanently delete the selected user(s). This cannot be undone."
              : "Are you sure you want to delete user(s)?"
          }
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
      {restoreTarget && (
        <AlertModal
          loading={restoreUsers.isPending}
          onYes={handleConfirmRestore}
          open={!!restoreTarget}
          handleCancel={() => setRestoreTarget(null)}
          title="Reactivate user"
          text={`This will reactivate ${restoreTarget.name} and restore their access. Continue?`}
        />
      )}
    </div>
  );
};

export default UsersPage;
