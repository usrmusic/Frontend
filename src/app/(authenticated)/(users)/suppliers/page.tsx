"use client";
import { useDeleteSupplier, useSuppliers } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType } from "antd";
import { useState } from "react";
import SupplierModal from "./SupplierModal";
import { Pencil } from "lucide-react";
import AlertModal from "@/src/components/common/AlertModal";
import { TableRowSelection } from "antd/es/table/interface";
import { CSVLink } from "react-csv";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const SuppliersPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [supplierItemData, setSupplierItemData] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [alertModal, setAlertModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 1000);

  const { data: suppliersData, isLoading } = useSuppliers({
    ...params,
    search: debouncedSearch,
  });
  const deleteSupplier = useDeleteSupplier();

  const handleCancel = () => {
    setSupplierItemData(null);
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
    deleteSupplier.mutate(
      { ids: selectedRowKeys, force: false },
      {
        onSuccess: () => {
          setAlertModal(false);
          notification.success({
            message: "Success",
            description: "Supplier(s) deleted successfully.",
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

  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Company Name", key: "company_name" },
    { label: "Mobile", key: "contact_number" },
    { label: "Email", key: "email" },
    { label: "Industry", key: "industry" },
    { label: "Notes", key: "notes" },
  ];
  const csvData = suppliersData?.data.map((row) => ({
    name: row.name,
    company_name: row.company_name,
    contact_number: row.contact_number,
    email: row.email,
    industry: row.industry,
    notes: row.notes,
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
              filename="suppliers.csv"
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
        rowSelection={rowSelection}
      />
      <SupplierModal
        initialValues={supplierItemData}
        modalOpen={modalOpen}
        onCancel={handleCancel}
      />
      {alertModal && (
        <AlertModal
          loading={deleteSupplier.isPending}
          onYes={handleDelete}
          open={alertModal}
          handleCancel={() => setAlertModal(false)}
          title="Delete Supplier"
          text="Are you sure you want to delete supplier(s)?"
        />
      )}
    </div>
  );
};

export default SuppliersPage;
