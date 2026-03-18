"use client";
import { Company, useCompanies, useDeleteCompany } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import AlertModal from "@/src/components/common/AlertModal";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { useDebounce } from "@/src/hooks/useDebounce";
import { Modal, notification, TableColumnsType } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
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

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const CompanyPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1000);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [alertModal, setAlertModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: companiesData, isLoading } = useCompanies({
    ...params,
    search: debouncedSearch,
  });
  const deleteCompany = useDeleteCompany();

  const handleCancel = () => {
    setModalOpen(false);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleDelete = () => {
    deleteCompany.mutate(
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
  };
  const columns: TableColumnsType = [
    {
      title: "Company Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Logo",
      dataIndex: "company_logo",
      key: "company_logo",
      render: (logo: string) =>
        logo ? (
          <span className="text-blue-600 underline">{logo}</span>
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
          <span className="text-blue-600 underline">{brochure}</span>
        ) : (
          <span className="">N/A</span>
        ),
    },
    {
      title: "Bank Detail",
      key: "bankDetail",
      render: (company: Company) => (
        <>
          {company.bank_name} {company.sort_code}
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: () => <Eye size={14} />,
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalOpen(true)}>Add</Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => setAlertModal(true)}
            >
              Remove
            </Button>
            <Button>Export Data</Button>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        loading={isLoading}
        rowSelection={rowSelection}
        dataSource={companiesData?.data}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: companiesData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        rowKey={(data) => data.id}
      />
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
      {alertModal && (
        <AlertModal
          loading={deleteCompany.isPending}
          onYes={handleDelete}
          open={alertModal}
          handleCancel={() => setAlertModal(false)}
          title="Delete User"
          text="Are you sure you want to delete user(s)?"
        />
      )}
    </div>
  );
};

export default CompanyPage;
