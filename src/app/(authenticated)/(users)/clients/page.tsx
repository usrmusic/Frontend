"use client";
import { useClients } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import { useState, Suspense } from "react";
import ClientModal from "./ClientModal";
import { Pencil } from "lucide-react";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const ClientsPageContent = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [clientData, setClientData] = useState(null);

  const debouncedSearch = useDebounce(search, 1000);
  const { data: apiData, isLoading } = useClients({
    ...params,
    search: debouncedSearch,
  });

  const handleCancel = () => {
    setClientData(null);
    setModalOpen(false);
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
      title: "Password",
      dataIndex: "password",
      key: "password",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => (
        <span
          className={`whitespace-nowrap ${
            value?.toLowerCase() === "active"
              ? "px-2 py-1 rounded-full text-green-700 bg-green-100"
              : "px-2 py-1 rounded-full text-gray-600 bg-yellow-100"
          }`}
        >
          {value ?? "No Status"}
        </span>
      ),
    },
    {
      title: "Event Date",
      dataIndex: "eventDate",
      key: "eventDate",
    },
    {
      title: "Contact Number",
      dataIndex: "contact_number",
      key: "contact_number",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Action",
      fixed: "right",
      render: (data) => (
        <button
          onClick={() => {
            setModalOpen(true);
            setClientData(data);
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
            <Button>Remove</Button>
            <Button>Deleted Users</Button>
            <Button>Export Data</Button>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        loading={isLoading}
        dataSource={apiData?.data}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: apiData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        rowKey={(data) => data.id}
      />
      {modalOpen && (
        <ClientModal
          modalOpen={modalOpen}
          onCancel={handleCancel}
          initialValues={clientData}
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
