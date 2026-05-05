"use client";
import { Company, useCompanies, useDeleteCompany } from "@/src/api/usersApi";
import AxiosInstance from "@/src/lib/axios";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import AlertModal from "@/src/components/common/AlertModal";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import { Pencil } from "lucide-react";
import { useState } from "react";
import CompanyModal from "./CompanyModal";
import { CSVLink } from "react-csv";

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
  const [companyItem, setCompanyItem] = useState(null);

  const { data: companiesData, isLoading } = useCompanies({
    ...params,
    search: debouncedSearch,
  });
  const deleteCompany = useDeleteCompany();
  const [api, contextHolder] = notification.useNotification();

  const handleCancel = () => {
    setModalOpen(false);
    setCompanyItem(null);
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
              api.success({
                message: "Success",
                description: "Company(s) deleted successfully.",
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
          <span className="text-black">{logo}</span>
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
          <span className="text-black">{brochure}</span>
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
      fixed: "right",
      render: (data) => (
        <div className="flex gap-3">
          {/* <Eye size={14} /> */}
          <button
            onClick={async () => {
              try {
                const res = await AxiosInstance.get(`/company/${data.id}`);
                const item = res?.data?.data || data;
                setCompanyItem(item);
                setModalOpen(true);
              } catch {
                api.error({ message: 'Error', description: 'Failed to load company details' });
                // fallback to passing row data
                setCompanyItem(data);
                setModalOpen(true);
              }
            }}
          >
            <Pencil size={14} />
          </button>
        </div>
      ),
    },
  ];

  const csvHeaders = [
    { label: "Company Name", key: "name" },
    { label: "Logo", key: "company_logo" },
    { label: "Brochure", key: "brochure" },
    { label: "Bank Name", key: "bank_name" },
    { label: "Sort Code", key: "sort_code" },
  ];
  const csvData = companiesData?.data.map((row) => ({
    name: row.name,
    company_logo: row.company_logo,
    brochure: row.brochure,
    bank_name: row.bank_name,
    sort_code: row.sort_code,
  }));

  return (
    <div className="space-y-4 mt-4">
      {contextHolder}
      {/* Filters Card */}
      <Card variant="green">
        <div className="flex items-center justify-between">
          <div className="flex w-[300px] items-center gap-2 rounded-lg bg-white px-4 h-10">
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
            <Button onClick={() => {
              setCompanyItem(null);
              setModalOpen(true);
            }}>Add</Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => setAlertModal(true)}
            >
              Remove
            </Button>
            <CSVLink
              data={csvData ?? []}
              filename="company.csv"
              headers={csvHeaders}
            >
              <Button>Export Data</Button>
            </CSVLink>
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
      {modalOpen && (
        <CompanyModal
          handleCancel={handleCancel}
          modalOpen={modalOpen}
          initialValues={companyItem}
        />
      )}
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
