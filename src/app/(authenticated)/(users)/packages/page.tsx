"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType } from "antd";
import { Eye, User } from "lucide-react";

const page = () => {
  const columns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Package Name",
      dataIndex: "packageName",
      key: "packageName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Cost Price",
      dataIndex: "costPrice",
      key: "costPrice",
    },
    {
      title: "Sell Price",
      dataIndex: "sellPrice",
      key: "sellPrice",
    },
    {
      title: "Actions",
      key: "actions",
      render: () => (
        <div className="flex gap-2">
          <span className="cursor-pointer" title="View">
            {/* Eye Icon (outline) */}
            <Eye size={14} />
          </span>
          <span className="cursor-pointer" title="User">
            {/* User Icon */}
            <User size={14} />
          </span>
        </div>
      ),
    },
  ];
  const data = [
    {
      name: "Michael Smith",
      packageName: "Premium Package",
      email: "michael@grandsupplies.com",
      costPrice: 1500,
      sellPrice: 2100,
    },
    {
      name: "Linda Johnson",
      packageName: "Event Master",
      email: "linda@skylinerentals.com",
      costPrice: 1200,
      sellPrice: 1800,
    },
    {
      name: "James Lee",
      packageName: "Stage Deluxe",
      email: "james@studioprops.com",
      costPrice: 900,
      sellPrice: 1350,
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
            <Button>Add</Button>
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
    </div>
  );
};

export default page;
