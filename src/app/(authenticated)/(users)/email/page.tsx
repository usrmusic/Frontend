"use client";
import { useEmail, EmailContent } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import { useState } from "react";
import { CSVLink } from "react-csv";
import EmailModal from "./EmailModal";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const EmailPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [emailItem, setEmailItem] = useState<EmailContent | null>(null);
  const debouncedSearch = useDebounce(search, 1000);

  const { data: emailData, isLoading } = useEmail({
    ...params,
    search: debouncedSearch,
  });

  const openEdit = (record: EmailContent) => {
    setEmailItem(record);
    setModalOpen(true);
  };

  const handleCancel = () => {
    setEmailItem(null);
    setModalOpen(false);
  };

  const columns: TableColumnsType<EmailContent> = [
    {
      title: "Name",
      dataIndex: "email_name",
      key: "email_name",
      width: "15%",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      width: "15%",
    },
    {
      title: "Body",
      dataIndex: "body",
      key: "body",
      width: "70%",
    },
  ];

  const csvHeaders = [
    { label: "Name", key: "email_name" },
    { label: "Subject", key: "subject" },
    { label: "Body", key: "body" },
  ];
  const csvData = emailData?.data.map((row) => ({
    email_name: row.email_name,
    subject: row.subject,
    body: row.body,
  }));

  return (
    <div className="space-y-4 mt-4">
      {/* Filters Card */}
      <Card variant="green">
          {/* Desktop (lg+) is the ORIGINAL layout, untouched: one row, search
              300px on the left, buttons natural-width on the right. The stacked
              treatment below applies only under 1024px, where the two groups
              genuinely cannot share a row — a 300px search plus this button set
              needs ~754px, more than a 768px tablet has after the shell's
              padding. */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full lg:w-[300px] items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
            <CSVLink
              data={csvData ?? []}
              filename="emails.csv"
              headers={csvHeaders}
              className="w-full lg:w-auto"
            >
              <Button className="w-full lg:w-auto">Export Data</Button>
            </CSVLink>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable<EmailContent>
        columns={columns}
        rowKey={(data) => data.id}
        dataSource={emailData?.data}
        tableLayout="fixed"
        loading={isLoading}
        onRow={(record) => ({
          onDoubleClick: () => openEdit(record),
          className: "cursor-pointer select-none",
        })}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: emailData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
      />
      {modalOpen && (
        <EmailModal
          modalOpen={modalOpen}
          onCancel={handleCancel}
          initialValues={emailItem}
        />
      )}
    </div>
  );
};

export default EmailPage;
