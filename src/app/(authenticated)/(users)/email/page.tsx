"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType } from "antd";
import { Eye } from "lucide-react";

const page = () => {
  const columns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Body",
      dataIndex: "body",
      key: "body",
    },
  ];

  const data = [
    {
      key: "1",
      name: "Michael Smith",
      subject: "Welcome to Grand Supplies",
      body: "Dear Michael, welcome to Grand Supplies Inc. We are excited to work with you.",
    },
    {
      key: "2",
      name: "Linda Johnson",
      subject: "Your Invoice from Skyline Rentals",
      body: "Hi Linda, please find your invoice attached for the recent venue rental.",
    },
    {
      key: "3",
      name: "James Lee",
      subject: "Studio Props LLC - New Catalogue",
      body: "Hello James, check out our latest prop catalogue for 2024. Let us know your feedback.",
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
            <Button>Export Data</Button>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable columns={columns} dataSource={data} pagination={false} />
    </div>
  );
};

export default page;
