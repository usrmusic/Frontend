"use client";
import { useSuppliers } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import { useState } from "react";
import SupplierModal from "./SupplierModal";
import { Pencil } from "lucide-react";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const SuppliersPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [supplierItemData, setSupplierItemData] = useState(null);

  const debouncedSearch = useDebounce(search, 1000);

  const { data: suppliersData, isLoading } = useSuppliers({
    ...params,
    search: debouncedSearch,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const handleCancel = () => {
    setSupplierItemData(null);
    setModalOpen(false);
  };
  const columns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Company Name",
      dataIndex: "company_name",
      key: "company_name",
    },
    {
      title: "Mobile",
      dataIndex: "contact_number",
      key: "contact_number",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Industry",
      dataIndex: "industry",
      key: "industry",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
    },
    {
      title: "Action",
      render: (data) => (
        <button
          onClick={() => {
            setModalOpen(true);
            setSupplierItemData(data);
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
        dataSource={suppliersData?.data}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: suppliersData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        rowKey={(data) => data.id}
      />
      <SupplierModal
        initialValues={supplierItemData}
        modalOpen={modalOpen}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default SuppliersPage;
