"use client";
import {
  useDeletePackage,
  usePackages,
  useEquipment,
  useDeleteEquipment,
  useEditPackage,
  useReorderEquipment,
  Equipment,
} from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import AlertModal from "@/src/components/common/AlertModal";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType, TableProps } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import { SorterResult } from "antd/es/table/interface";
import { GripVertical, Pencil } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PackageModal from "./PackageModal";
import EquipmentModal from "./EquipmentModal";
import { CSVLink } from "react-csv";

const initialParams: {
  page: number;
  perPage: number;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {
  page: 1,
  perPage: 10,
  search: "",
};

const StatusToggle = ({
  status,
  onClick,
  loading,
}: {
  status?: string;
  onClick: () => void;
  loading?: boolean;
}) => {
  const isActive = status !== "INACTIVE";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
        isActive
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-gray-200 text-gray-500 hover:bg-gray-300"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </button>
  );
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

  // Equipment tab: click-to-sort by a column, wired to the backend's
  // sort_by/sort_dir query params (matches the legacy Laravel list: bootstrap-table
  // with sortable columns and pagination disabled).
  const [equipmentSort, setEquipmentSort] = useState<{
    field?: string;
    order?: "asc" | "desc";
  }>({});
  // Manual drag order (persisted to equipment.sort_order) only makes sense
  // while no column sort is overriding the view — dragging while a sort is
  // active would silently reorder rows the user can't see move relative to
  // their sorted position.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const reorderEquipment = useReorderEquipment();

  const { data: packagesData, isLoading } = usePackages({
    ...params,
    search: debouncedSearch,
  });
  // Equipment tab shows everything on one page (perPage: "all"), matching the
  // legacy Laravel bootstrap-table config (`pagination: false`).
  const equipmentParams = {
    page: 1,
    perPage: "all" as const,
    search: debouncedSearch,
    sort_by: equipmentSort.field,
    sort_dir: equipmentSort.order,
  };
  const { data: equipmentDataRes, isLoading: equipmentLoading } = useEquipment(equipmentParams);

  const deletePackage = useDeletePackage();
  const deleteEquipment = useDeleteEquipment();
  const editPackage = useEditPackage();

  const handleCancel = () => {
    setPackageItem(null);
    setEquipmentItem(null);
    setModalOpen(false);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<any> = {
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

  const handleToggleStatus = (row: { id: number; status?: string }) => {
    editPackage.mutate({
      id: row.id,
      status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  };

  const handlePackagesTableChange: TableProps<any>["onChange"] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : (sorter as SorterResult<any>);
    setParams((p) => ({
      ...p,
      sortBy: s?.order && typeof s.field === "string" ? s.field : undefined,
      sortOrder: s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : undefined,
    }));
  };

  const handleEquipmentTableChange: TableProps<Equipment>["onChange"] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : (sorter as SorterResult<Equipment>);
    if (!s || !s.order || typeof s.field !== "string") {
      setEquipmentSort({});
      return;
    }
    setEquipmentSort({ field: s.field, order: s.order === "ascend" ? "asc" : "desc" });
  };

  // ── Equipment row drag-and-drop ──
  const equipmentSortActive = !!equipmentSort.field;
  const handleEquipmentDragStart = (idx: number) => setDragIndex(idx);
  const handleEquipmentDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleEquipmentDrop = (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx || !equipmentDataRes?.data) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...equipmentDataRes.data];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIdx, 0, moved);
    setDragIndex(null);
    setDragOverIndex(null);
    // Optimistic reorder so the drop feels instant, then persist — a failed
    // mutation invalidates the query anyway and snaps back to server order.
    queryClient.setQueryData(["equipment", equipmentParams], {
      ...equipmentDataRes,
      data: next,
    });
    reorderEquipment.mutate(next.map((row) => row.id));
  };
  const handleEquipmentDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const columns: TableColumnsType = [
    {
      title: "Name",
      // Kept as a plain string (not the dotted path some AntD versions
      // resolve as a nested accessor) purely so `sorter.field` reports
      // "users.name" for the backend's dot-notation relation sort — the
      // cell itself is still read from the full row via `record` below.
      dataIndex: "users.name",
      key: "name",
      sorter: true,
      render: (_, record) => <>{record.users.name}</>,
    },
    {
      title: "Package Name",
      dataIndex: "package_name",
      key: "package_name",
      sorter: true,
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
      sorter: true,
    },
    {
      title: "Sell Price",
      dataIndex: "sell_price",
      key: "sellPrice",
      sorter: true,
    },
    {
      title: "Status",
      key: "status",
      render: (data) => (
        <StatusToggle
          status={data.status}
          loading={editPackage.isPending}
          onClick={() => handleToggleStatus(data)}
        />
      ),
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

  const equipmentColumns: TableColumnsType<Equipment> = [
    {
      title: "",
      key: "drag",
      width: 32,
      render: () => (
        <GripVertical
          size={16}
          className={equipmentSortActive ? "text-gray-300" : "cursor-grab text-gray-400"}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      sorter: true,
    },
    {
      title: "Cost Price",
      dataIndex: "cost_price",
      key: "cost_price",
      sorter: true,
    },
    {
      title: "Sell Price",
      dataIndex: "sell_price",
      key: "sell_price",
      sorter: true,
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
          onChange={handlePackagesTableChange}
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
        <DataTable<Equipment>
          columns={equipmentColumns}
          dataSource={equipmentDataRes?.data}
          loading={equipmentLoading}
          onChange={handleEquipmentTableChange}
          pagination={false}
          rowKey={(data) => Number(data.id)}
          rowSelection={rowSelection as TableRowSelection<Equipment>}
          onRow={(_record, index) =>
            equipmentSortActive || index === undefined
              ? {}
              : {
                  draggable: true,
                  onDragStart: () => handleEquipmentDragStart(index),
                  onDragOver: (e: React.DragEvent) => handleEquipmentDragOver(e, index),
                  onDrop: () => handleEquipmentDrop(index),
                  onDragEnd: handleEquipmentDragEnd,
                  className: dragOverIndex === index ? "bg-primary/5" : undefined,
                }
          }
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
