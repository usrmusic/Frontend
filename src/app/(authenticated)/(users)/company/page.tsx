"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { Modal, TableColumnsType } from "antd";
import {
  Building2,
  Eye,
  FileInput,
  Globe,
  Landmark,
  Mail,
  NotebookTabs,
  Percent,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";
import { BsInstagram } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa";
import { FaEnvelopesBulk } from "react-icons/fa6";

const CompanyPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleCancel = () => {
    setModalOpen(false);
  };
  const columns: TableColumnsType = [
    {
      title: "Company Name",
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: "Logo",
      dataIndex: "logo",
      key: "logo",
      render: (logo: string) =>
        logo ? (
          <a
            href={logo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {logo}
          </a>
        ) : (
          <span className="">N/A</span>
        ),
    },
    {
      title: "Brochure",
      dataIndex: "brochure",
      key: "brochure",
      render: (brochure: string) =>
        brochure ? (
          <a
            href={brochure}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {brochure}
          </a>
        ) : (
          <span className="">N/A</span>
        ),
    },
    {
      title: "Bank Detail",
      dataIndex: "bankDetail",
      key: "bankDetail",
    },
    {
      title: "Actions",
      key: "actions",
      render: () => <Eye size={14} />,
    },
  ];
  const data = [
    {
      key: "1",
      name: "Michael Smith",
      companyName: "Grand Supplies Inc.",
      logo: "grand-supplies.png",
      brochure: "grand-supplies.pdf",
      bankDetail: "Bank of Springfield, Acc: 123456, IFSC: SPRB0001234",
    },
    {
      key: "2",
      name: "Linda Johnson",
      companyName: "Skyline Rentals",
      logo: "skyline-rentals.png",
      brochure: "",
      bankDetail: "Metro Bank, Acc: 678910, IFSC: METB0005678",
    },
    {
      key: "3",
      name: "James Lee",
      companyName: "Studio Props LLC",
      logo: "",
      brochure: "studio-props.pdf",
      bankDetail: "Gotham Bank, Acc: 112233, IFSC: GOTH0001122",
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
      <DataTable columns={columns} dataSource={data} pagination={false} />
      <Modal
        open={modalOpen}
        onCancel={handleCancel}
        title="Add Company"
        okText="Add"
        centered
        width={700}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-center font-medium">Company Details</p>
            <Input label="Company Name" labelIcon={<Building2 size={14} />} />
          </div>
          <div className="space-y-3">
            <p className="text-center font-medium">Files</p>
            <Input
              label="Company Logo"
              type="file"
              labelIcon={<FileInput size={14} />}
            />
            <Input
              label="Brochure"
              type="file"
              labelIcon={<FileInput size={14} />}
            />
          </div>
          <div className="space-y-3">
            <p className="text-center font-medium">Contact Details</p>
            <Input label="Name" labelIcon={<User size={14} />} />
            <Input label="Telephone Number" labelIcon={<Phone size={14} />} />
            <Input label="Email" type="email" labelIcon={<Mail size={14} />} />
            <Input label="Website" labelIcon={<Globe size={14} />} />
            <Input label="Instagram" labelIcon={<BsInstagram size={14} />} />
            <Input label="Facebook" labelIcon={<FaFacebook size={14} />} />
          </div>
          <div className="space-y-3">
            <p className="text-center font-medium">Address Details</p>
            <Input
              label="Address Name Number"
              labelIcon={<NotebookTabs size={14} />}
            />
            <Input label="Street" />
            <Input label="City" labelIcon={<Building2 size={14} />} />
            <Input
              label="Postal Code"
              labelIcon={<FaEnvelopesBulk size={14} />}
            />
          </div>
          <div className="space-y-3">
            <p className="text-center font-medium">Bank Details</p>
            <Input label="Bank Name" labelIcon={<Landmark size={14} />} />
            <Input label="Account Number" />
            <Input label="Sort Code" labelIcon={<Landmark size={14} />} />
            <Input label="Vat" labelIcon={<Percent size={14} />} />
            <Input label="Vat Percentage" labelIcon={<Percent size={14} />} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyPage;
