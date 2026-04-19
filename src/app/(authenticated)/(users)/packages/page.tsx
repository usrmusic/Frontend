"use client";
import { useDeletePackage, usePackages } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import AlertModal from "@/src/components/common/AlertModal";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import { Pencil } from "lucide-react";
import { useState } from "react";
import PackageModal from "./PackageModal";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const PackagesPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [alertModal, setAlertModal] = useState(false);
  const [packageItem, setPackageItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 1000);

  const { data: packagesData, isLoading } = usePackages({
    ...params,
    search: debouncedSearch,
  });

  const deletePackage = useDeletePackage();

  const handleCancel = () => {
    setPackageItem(null);
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
    deletePackage.mutate(
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
      key: "name",
      render: (data) => <>{data.users.name}</>,
    },
    {
      title: "Package Name",
      dataIndex: "package_name",
      key: "package_name",
    },
    {
      title: "Email",
      key: "email",
      render: (data) => <>{data.users.email}</>,
    },
    {
      title: "Cost Price",
      dataIndex: "cost_price",
      key: "costPrice",
    },
    {
      title: "Sell Price",
      dataIndex: "sell_price",
      key: "sellPrice",
    },
    {
      title: "Actions",
      key: "actions",
      render: (data) => (
        <div className="flex gap-2">
          {/* <span className="cursor-pointer" title="View">
            <Eye size={14} />
          </span>
          <span className="cursor-pointer" title="User">
            <User size={14} />
          </span> */}
          <button
            onClick={() => {
              setModalOpen(true);
              setPackageItem(data);
            }}
          >
            <Pencil size={14} />
          </button>
        </div>
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
            {/* <Button>Export Data</Button> */}
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        dataSource={packagesData?.data}
        loading={isLoading}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: packagesData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        rowKey={(data) => Number(data.id)}
        rowSelection={rowSelection}
      />
      {modalOpen && (
        <PackageModal
          handleCancel={handleCancel}
          modalOpen={modalOpen}
          initialValues={packageItem}
        />
      )}
      {alertModal && (
        <AlertModal
          loading={deletePackage.isPending}
          onYes={handleDelete}
          open={alertModal}
          handleCancel={() => setAlertModal(false)}
          title="Delete Pacakge"
          text="Are you sure you want to delete package(s)?"
        />
      )}
    </div>
  );
};

export default PackagesPage;
