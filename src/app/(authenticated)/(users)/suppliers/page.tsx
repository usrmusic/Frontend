"use client";
import { useDeleteSupplier, useSuppliers } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType, TableProps } from "antd";
import { useState } from "react";
import SupplierModal from "./SupplierModal";
import { Pencil } from "lucide-react";
import AlertModal from "@/src/components/common/AlertModal";
import { TableRowSelection, SorterResult } from "antd/es/table/interface";
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
      sorter: true,
    },
    {
      title: "Company Name",
      dataIndex: "company_name",
      key: "company_name",
      sorter: true,
    },
    {
      title: "Mobile",
      dataIndex: "contact_number",
      key: "contact_number",
      sorter: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: "Industry",
      dataIndex: "industry",
      key: "industry",
      sorter: true,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      sorter: true,
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
          {/* Three buttons, all short labels — plain flex-wrap always fit
              them on one row at any real width, but left them at natural
              size flush left with empty space trailing. `flex-1` spreads
              them across the full row width instead. */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
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
              <Button className="w-full lg:w-auto">Export Data</Button>
            </CSVLink>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        loading={isLoading}
        dataSource={suppliersData?.data}
        onChange={handleTableChange}
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
