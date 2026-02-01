import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType } from "antd";
import { MoreVertical } from "lucide-react";
import Link from "next/link";

const page = () => {
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
      title: "Contact Number",
      dataIndex: "contactNumber",
      key: "contactNumber",
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
    },
    {
      title: "Reset Password",
      dataIndex: "resetPassword",
      key: "resetPassword",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
  ];
  const data = [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      contactNumber: "1234567890",
      password: "1234567890",
      resetPassword: "1234567890",
      address: "1234567890",
      role: "Admin",
    },
    {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      contactNumber: "1234567890",
      password: "1234567890",
      resetPassword: "1234567890",
      address: "1234567890",
      role: "Admin",
    },
  ];
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="">
            <BackButton />
          </Link>
          <h2 className="themeH1">Users</h2>
        </div>
        <div className="flex gap-2">
          <Button type="primary" className="w-[94px]">
            Users
          </Button>
          <Button className="w-[94px]">Clients</Button>
          <Button className="w-[94px]">Venues</Button>
          <Button className="w-[94px]">Suppliers</Button>
          <Button className="w-[94px]">Packages</Button>
          <Button className="w-[94px]">Company</Button>
          <Button className="w-[135px]">Manange Access</Button>
          <Button className="w-[94px]">Email</Button>
          <button className="w-[30px] flex items-center justify-center rounded-lg bg-white hover:bg-secondary-200 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
      {/* Filters Card */}
      <Card variant="green">
        <div className="flex items-center justify-between">
          <div className="flex max-w-[385px] items-center gap-2 rounded-lg bg-white px-4 h-10">
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
      <DataTable columns={columns} dataSource={data} pagination={false} />
    </div>
  );
};

export default page;
