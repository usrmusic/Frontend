"use client";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType, TableProps } from "antd";
import { MoreVertical } from "lucide-react";
import Link from "next/link";

const page = () => {
  const rowSelection: TableProps["rowSelection"] = {
    onChange: (selectedRowKeys: React.Key[], selectedRows) => {
      console.log(
        `selectedRowKeys: ${selectedRowKeys}`,
        "selectedRows: ",
        selectedRows,
      );
    },
  };

  const columns: TableColumnsType = [
    {
      key: "name",
      dataIndex: "name",
      title: "Name",
    },
    {
      key: "email",
      dataIndex: "email",
      title: "Email",
    },
    {
      key: "mobile",
      dataIndex: "mobile",
      title: "Mobile",
    },
    {
      key: "venue",
      dataIndex: "venue",
      title: "Venue",
    },
    {
      key: "date",
      dataIndex: "date",
      title: "Event Date",
    },
    {
      key: "payment",
      dataIndex: "payment",
      title: "Payment",
      render: (data) => (
        <div
          className={`${data === "completed" && "bg-[#D4F4DD]"} ${data === "pending" && "bg-[#FFF4CC] text-[#9C6F19]"} w-[98px] rounded-full text-center text-[#0F7B3B] py-1 text-xs capitalize`}
        >
          {data}
        </div>
      ),
    },
  ];

  const data = [
    {
      name: "Sangeeta Kaushik",
      email: "sangeeta@test.com",
      mobile: "07922629123",
      venue: "Atheneus Haves",
      date: "27/04/2024",
      payment: "completed",
    },
    {
      name: "Sangeeta Kaushik",
      email: "johndeo@test.com",
      mobile: "07922629123",
      venue: "Atheneus Haves",
      date: "27/04/2024",
      payment: "pending",
    },
    {
      name: "Sangeeta Kaushik",
      email: "jonny@test.com",
      mobile: "07922629123",
      venue: "Atheneus Haves",
      date: "27/04/2024",
      payment: "pending",
    },
    {
      name: "Sangeeta Kaushik",
      email: "biggy@test.com",
      mobile: "07922629123",
      venue: "Atheneus Haves",
      date: "27/04/2024",
      payment: "pending",
    },
  ];
  return (
    <>
      <div className="space-y-4 mt-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="">
              <BackButton />
            </Link>
            <h2 className="themeH1">Completed Events</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button>View</Button>
            <Button type="primary">Send Email</Button>
            <Button type="primary">Send Invoice</Button>
            <Button type="default">Download Invoice</Button>
            <Button type="default">Export Data</Button>
            <button className=" size-9 flex items-center justify-center rounded-lg bg-white hover:bg-secondary-200 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <select
            name="event"
            id="event"
            className="bg-white rounded-lg h-10 px-3 text-sm"
          >
            <option value="">Select Event</option>
            <option value="event one">event one</option>
          </select>
          <div className="flex max-w-[385px] items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
            />
          </div>
        </div>
        <DataTable
          rowSelection={rowSelection}
          columns={columns}
          rowKey={(data) => data.email}
          dataSource={data}
          pagination={false}
        />
      </div>
    </>
  );
};

export default page;
