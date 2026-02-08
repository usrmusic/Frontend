"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { Modal, TableColumnsType } from "antd";
import { useState } from "react";

const SuppliersPage = () => {
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
      title: "Company Name",
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
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
  ];
  const data = [
    {
      name: "Michael Smith",
      companyName: "Grand Supplies Inc.",
      mobile: "555-1234",
      email: "michael@grandsupplies.com",
      industry: "Event Supplies",
      notes: "Reliable premium supplier for large events.",
    },
    {
      name: "Linda Johnson",
      companyName: "Skyline Rentals",
      mobile: "555-5678",
      email: "linda@skylinerentals.com",
      industry: "Venue Equipment",
      notes: "Offers special rates for returning clients.",
    },
    {
      name: "James Lee",
      companyName: "Studio Props LLC",
      mobile: "555-9012",
      email: "james@studioprops.com",
      industry: "Stage Props",
      notes: "Known for quick deliveries and custom props.",
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
          <Input label="Company Name" />
          <Input label="Email" />
          <Input label="Mobile" />
          <Input label="Industry" />
          <Input label="Notes" />
        </div>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
