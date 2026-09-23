"use client";
import { Company, useCompanies, useDeleteCompany } from "@/src/api/usersApi";
import AxiosInstance from "@/src/lib/axios";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import AlertModal from "@/src/components/common/AlertModal";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { notification, TableColumnsType, TableProps } from "antd";
import { TableRowSelection, SorterResult } from "antd/es/table/interface";
import { Pencil } from "lucide-react";
import { useState } from "react";
import CompanyModal from "./CompanyModal";
import { CSVLink } from "react-csv";

const initialParams: {
  page: number;
  perPage: number;
  search: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
} = {
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

  const handleTableChange: TableProps<any>["onChange"] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : (sorter as SorterResult<any>);
    setParams((p) => ({
      ...p,
      sort_by: s?.order && typeof s.field === "string" ? s.field : undefined,
      sort_dir: s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : undefined,
    }));
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
      sorter: true,
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
        {/* Search always gets its own complete row and the action buttons
            always get the row below — never sharing one row, at any width. This
            replaces `sm:flex-row`, which put search and buttons side by side
            from `sm` up: with a search box capped at `sm:w-[300px]` and a
            2-4 button group beside it, that row could exceed available width
            at in-between sizes (a 768px iPad, for example), forcing an uneven
            wrap of whichever few buttons didn't fit rather than a clean two-row
            layout. Unconditional `flex-col` removes the possibility entirely —
            each row is exactly one group, full width, every time. */}
        <div className="flex flex-col gap-3">
          <div className="flex w-full items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Three buttons, all short labels — plain flex-wrap always fit
              them on one row at any real width, but left them at natural
              size flush left with empty space trailing. `flex-1` spreads
              them across the full row width instead. */}
          <div className="flex flex-wrap gap-2">
            <Button className="flex-1 min-w-[90px]" onClick={() => {
              setCompanyItem(null);
              setModalOpen(true);
            }}>Add</Button>
            <Button
              className="flex-1 min-w-[100px]"
              disabled={selectedRowKeys.length === 0}
              onClick={() => setAlertModal(true)}
            >
              Remove
            </Button>
            <CSVLink
              data={csvData ?? []}
              filename="company.csv"
              headers={csvHeaders}
              className="flex-1 min-w-[130px]"
            >
              <Button className="w-full">Export Data</Button>
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
        onChange={handleTableChange}
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
          title="Delete Company"
          text="Are you sure you want to delete company(s)?"
        />
      )}
    </div>
  );
};

export default CompanyPage;
