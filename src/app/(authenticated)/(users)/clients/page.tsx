"use client";
import {
  useClients,
  useDeleteClient,
  useResetUserPassword,
  useEditClient,
} from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType, TableProps } from "antd";
import { useState, Suspense } from "react";
import ClientModal from "./ClientModal";
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

const ClientsPageContent = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [showDeactivated, setShowDeactivated] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [resetTarget, setResetTarget] = useState<
    { id: number | string; email: string } | null
  >(null);
  const [reactivateTarget, setReactivateTarget] = useState<
    { id: number | string; name: string } | null
  >(null);

  const debouncedSearch = useDebounce(search, 1000);
  const { data: apiData, isLoading } = useClients({
    ...params,
    search: debouncedSearch,
    status: showDeactivated ? "inactive" : undefined,
  });
  const deleteClient = useDeleteClient();
  const resetPassword = useResetUserPassword();
  const editClient = useEditClient();

  const handleConfirmReactivate = () => {
    if (!reactivateTarget) return;
    editClient.mutate(
      { id: reactivateTarget.id, status: "active" },
      {
        onSuccess: () => {
          notification.success({
            message: "Client reactivated",
            description: `${reactivateTarget.name} is active again.`,
            placement: "topRight",
          });
          setReactivateTarget(null);
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
    setClientData(null);
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
    deleteClient.mutate(
      { ids: selectedRowKeys, force: showDeactivated },
      {
        onSuccess: (data: { count?: number }) => {
          setAlertModal(false);
          notification.success({
            message: "Success",
            description: showDeactivated
              ? `${data?.count ?? selectedRowKeys.length} client(s) permanently deleted.`
              : `${data?.count ?? selectedRowKeys.length} client(s) deactivated successfully.`,
            placement: "topRight",
          });
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
      title: "Password",
      dataIndex: "password_text",
      key: "password_text",
    },
    {
      title: "Status",
      dataIndex: "deleted_at",
      key: "status",
      render: (value: string | null) => (
        <span
          className={`whitespace-nowrap px-2 py-1 rounded-full text-xs ${
            value
              ? "text-red-700 bg-red-100"
              : "text-green-700 bg-green-100"
          }`}
        >
          {value ? "Deactivated" : "Active"}
        </span>
      ),
    },
    {
      title: "Contact Number",
      dataIndex: "contact_number",
      key: "contact_number",
      sorter: true,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      sorter: true,
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
              onClick={() => setReactivateTarget({ id: row.id, name: row.name })}
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
                setClientData(data);
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
    { label: "Password", key: "password" },
    { label: "Status", key: "status" },
    { label: "Event Date", key: "eventDate" },
    { label: "Contact Number", key: "contact_number" },
    { label: "Address", key: "address" },
  ];
  const csvData = apiData?.data.map((row) => ({
    name: row.name,
    email: row.email,
    password: row.password_text,
    status: row.status,
    eventDate: row.eventDate,
    contact_number: row.contact_number,
    address: row.address,
  }));

  return (
    <div className="space-y-4 mt-4">
      {/* Filters Card */}
      <Card variant="green">
          {/* Desktop (lg+) is the ORIGINAL layout, untouched: one row, search
              300px on the left, buttons natural-width on the right. The stacked
              treatment below applies only under 1024px, where the two groups
              genuinely cannot share a row — a 300px search plus this button set
              needs ~754px, more than a 768px tablet has after the shell's
              padding. */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full lg:w-[300px] items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
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
              filename="clients.csv"
              headers={csvHeaders}
              >
              <Button className="w-full lg:w-auto">Export Data</Button>
            </CSVLink>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        loading={isLoading}
        dataSource={apiData?.data}
        onChange={handleTableChange}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: apiData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        rowSelection={rowSelection}
        rowKey={(data) => data.id}
      />
      {modalOpen && (
        <ClientModal
          modalOpen={modalOpen}
          onCancel={handleCancel}
          initialValues={clientData}
        />
      )}
      {alertModal && (
        <AlertModal
          loading={deleteClient.isPending}
          onYes={handleDelete}
          open={alertModal}
          handleCancel={() => setAlertModal(false)}
          title={showDeactivated ? "Delete Client Permanently" : "Delete Client"}
          text={
            showDeactivated
              ? "This will permanently delete the selected client(s). This cannot be undone."
              : "Are you sure you want to delete client(s)?"
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
      {reactivateTarget && (
        <AlertModal
          loading={editClient.isPending}
          onYes={handleConfirmReactivate}
          open={!!reactivateTarget}
          handleCancel={() => setReactivateTarget(null)}
          title="Reactivate client"
          text={`This will reactivate ${reactivateTarget.name} and restore their access. Continue?`}
        />
      )}
    </div>
  );
};

const page = () => {
  // Wrap the client component in Suspense boundary for Next.js requirements
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientsPageContent />
    </Suspense>
  );
};

export default page;
