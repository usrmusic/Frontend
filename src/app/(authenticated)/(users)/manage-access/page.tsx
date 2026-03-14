"use client";
import { useManageAccess } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType } from "antd";
import { useState } from "react";
import RoleModal from "./RoleModal";

const ManageAccessPage = () => {
  const { data: manageAccessData, isLoading } = useManageAccess();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCancel = () => {
    setModalOpen(false);
  };
  const columns: TableColumnsType = [
    {
      title: "Role",
      dataIndex: "name",
      key: "name",
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
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalOpen(true)}>Add</Button>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        loading={isLoading}
        dataSource={manageAccessData?.roles}
        rowKey={(data) => data.id}
        pagination={false}
      />
      {modalOpen && (
        <RoleModal handleCancel={handleCancel} modalOpen={modalOpen} />
      )}
    </div>
  );
};

export default ManageAccessPage;
