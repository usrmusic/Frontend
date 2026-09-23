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
          {/* A single button on its own row otherwise sat at natural size
              flush left with a large gap of empty green trailing it — same
              lone-item fix applied everywhere else this session. */}
          <div className="flex flex-wrap gap-2 w-full">
            <CSVLink
              data={csvData ?? []}
              filename="emails.csv"
              headers={csvHeaders}
              className="w-full"
            >
              <Button className="w-full">Export Data</Button>
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
