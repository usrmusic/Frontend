"use client";
import { useEmail } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import { useState } from "react";
import { CSVLink } from "react-csv";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const EmailPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1000);

  const { data: emailData, isLoading } = useEmail({
    ...params,
    search: debouncedSearch,
  });
  const columns: TableColumnsType = [
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
            <CSVLink
              data={csvData ?? []}
              filename="emails.csv"
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
        rowKey={(data) => data.id}
        dataSource={emailData?.data}
        tableLayout="fixed"
        loading={isLoading}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: emailData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
      />
    </div>
  );
};

export default EmailPage;
