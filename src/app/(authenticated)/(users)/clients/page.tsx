"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { Modal, TableColumnsType } from "antd";
import { useState } from "react";

const ClientsPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleCancel = () => {
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
          className={
            value.toLowerCase() === "active"
              ? "px-2 py-1 rounded-full text-green-700 bg-green-100"
              : "px-2 py-1 rounded-full text-gray-600 bg-yellow-100"
          }
        >
          {value}
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
      dataIndex: "contactNumber",
      key: "contactNumber",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
  ];
  const data = [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      password: "secret123",
      status: "Active",
      eventDate: "2024-08-01",
      contactNumber: "1234567890",
      address: "123 Main St, Springfield",
    },
    {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      password: "secret456",
      status: "Inactive",
      eventDate: "2024-09-15",
      contactNumber: "9876543210",
      address: "456 Oak Ave, Metropolis",
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
            <Button>Remove</Button>
            <Button>Deleted Users</Button>
            <Button>Export Data</Button>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        dataSource={data}
        pagination={false}
        rowKey={(data) => data.email}
      />
      <Modal open={modalOpen} onCancel={handleCancel} title="Add" okText="Add">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" />
          <Input label="Email" />
          <Input label="Event Date" type="date" />
          <Input label="Contact Number" />
          <Input label="Address" />
        </div>
      </Modal>
    </div>
  );
};

export default ClientsPage;
