"use client";
import { useDeletePackage, usePackages, useEquipment, useDeleteEquipment } from "@/src/api/usersApi";
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
import EquipmentModal from "./EquipmentModal";
import { CSVLink } from "react-csv";

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
  const [activeTab, setActiveTab] = useState<'packages'|'equipment'>('packages');
  const [equipmentItem, setEquipmentItem] = useState(null);
  const debouncedSearch = useDebounce(search, 1000);

  const { data: packagesData, isLoading } = usePackages({
    ...params,
    search: debouncedSearch,
  });
  const { data: equipmentDataRes, isLoading: equipmentLoading } = useEquipment({ page: params.page, perPage: params.perPage, search: debouncedSearch });

  const deletePackage = useDeletePackage();
  const deleteEquipment = useDeleteEquipment();

  const handleCancel = () => {
    setPackageItem(null);
    setEquipmentItem(null);
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
    if (activeTab === 'packages') {
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
    } else {
      deleteEquipment.mutate(
        { ids: selectedRowKeys, force: false },
        {
          onSuccess: () => {
            setAlertModal(false);
            notification.success({
              message: "Success",
              description: "Equipment deleted successfully.",
              placement: "topRight",
            });
          },
        },
      );
    }
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

  const equipmentColumns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Cost Price",
      dataIndex: "cost_price",
      key: "cost_price",
    },
    {
      title: "Sell Price",
      dataIndex: "sell_price",
      key: "sell_price",
    },
    {
      title: "Actions",
      key: "actions",
      render: (data) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setModalOpen(true);
              setEquipmentItem(data);
            }}
          >
            <Pencil size={14} />
          </button>
        </div>
      ),
    },
  ];

  const packageCsvHeaders = [
    { label: "Name", key: "user_name" },
    { label: "Package Name", key: "package_name" },
    { label: "Email", key: "user_email" },
    { label: "Cost Price", key: "cost_price" },
    { label: "Sell Price", key: "sell_price" },
  ];
  const packageCsvData =
    packagesData?.data.map((row) => ({
      user_name: row.users?.name,
      package_name: row.package_name,
      user_email: row.users?.email,
      cost_price: row.cost_price,
      sell_price: row.sell_price,
    })) ?? [];

  const equipmentCsvHeaders = [
    { label: "Name", key: "name" },
    { label: "Quantity", key: "quantity" },
    { label: "Cost Price", key: "cost_price" },
    { label: "Sell Price", key: "sell_price" },
  ];
  const equipmentCsvData =
    equipmentDataRes?.data.map((row) => ({
      name: row.name,
      quantity: row.quantity,
      cost_price: row.cost_price,
      sell_price: row.sell_price,
    })) ?? [];

  return (
    <div className="space-y-4 mt-4">
      {/* Filters Card */}
      <Card variant="green">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
            <div className="flex rounded-md overflow-hidden bg-secondary-200">
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'packages' ? 'bg-white text-primary' : 'text-gray-600 hover:text-primary'
                } rounded-l-md`}
                onClick={() => setActiveTab('packages')}
              >
                Packages
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'equipment' ? 'bg-white text-primary' : 'text-gray-600 hover:text-primary'
                } rounded-r-md`}
                onClick={() => setActiveTab('equipment')}
              >
                Equipment
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setPackageItem(null); setEquipmentItem(null); setModalOpen(true); }}>{activeTab === 'packages' ? 'Add' : 'Add'}</Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => setAlertModal(true)}
            >
              Remove
            </Button>
            <CSVLink
              data={activeTab === "packages" ? packageCsvData : equipmentCsvData}
              filename={
                activeTab === "packages" ? "packages.csv" : "equipment.csv"
              }
              headers={
                activeTab === "packages"
                  ? packageCsvHeaders
                  : equipmentCsvHeaders
              }
            >
              <Button>Export Data</Button>
            </CSVLink>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      {activeTab === 'packages' ? (
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
      ) : (
        <DataTable
          columns={equipmentColumns}
          dataSource={equipmentDataRes?.data}
          loading={equipmentLoading}
          pagination={{
            pageSize: params.perPage,
            current: params.page,
            total: equipmentDataRes?.meta.total,
            onChange: (page, pageSize) =>
              setParams({ ...params, page, perPage: pageSize }),
          }}
          rowKey={(data) => Number(data.id)}
          rowSelection={rowSelection}
        />
      )}
      {modalOpen && activeTab === 'packages' && (
        <PackageModal
          handleCancel={handleCancel}
          modalOpen={modalOpen}
          initialValues={packageItem}
        />
      )}
      {modalOpen && activeTab === 'equipment' && (
        <EquipmentModal
          handleCancel={handleCancel}
          modalOpen={modalOpen}
          initialValues={equipmentItem}
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
