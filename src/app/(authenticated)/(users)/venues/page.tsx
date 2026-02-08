"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { Modal, TableColumnsType } from "antd";
import { useState } from "react";

const VenuesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleCancel = () => {
    setModalOpen(false);
  };
  const columns: TableColumnsType = [
    {
      title: "Venue",
      dataIndex: "venue",
      key: "venue",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
    },
    {
      title: "Power",
      dataIndex: "power",
      key: "power",
    },
    {
      title: "Access",
      dataIndex: "access",
      key: "access",
    },
    {
      title: "Smoke Note",
      dataIndex: "smokeNote",
      key: "smokeNote",
    },
    {
      title: "Rigging Point",
      dataIndex: "riggingPoint",
      key: "riggingPoint",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
    },
  ];
  const data = [
    {
      venue: "Grand Ballroom",
      address: "123 Main St, Springfield",
      stage: "Main Stage",
      power: "Available",
      access: "Front/Back Entrances",
      smokeNote: "Smoke machines allowed",
      riggingPoint: "4 rigging points in ceiling",
      notes: "Ideal for weddings and conferences.",
    },
    {
      venue: "Skyline Rooftop",
      address: "456 Elm Ave, Metropolis",
      stage: "Outdoor Stage",
      power: "Limited",
      access: "Elevator, Stairs",
      smokeNote: "No smoke allowed",
      riggingPoint: "No rigging points",
      notes: "Beautiful city skyline view.",
    },
    {
      venue: "The Studio",
      address: "789 Studio Lane, Gotham",
      stage: "Flexible Setup",
      power: "Available",
      access: "Ground floor entrance",
      smokeNote: "Smoke allowed with approval",
      riggingPoint: "2 rigging bars",
      notes: "Perfect for intimate performances.",
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
          <Input label="Venue" />
          <Input label="Address" />
          <Input label="Stage" />
          <Input label="Power" />
          <Input label="Access" />
          <Input label="Rigging Point" />
          <Input label="Notes" />
        </div>
      </Modal>
    </div>
  );
};

export default VenuesPage;
