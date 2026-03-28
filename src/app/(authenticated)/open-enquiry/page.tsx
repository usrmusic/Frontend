"use client";
import { useOpenEnquiryList } from "@/src/api/enquiry";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SendBrochureModal from "./SendBrochure";

const initialParams = {
  page: 1,
  limit: 10,
  search: "",
};

const OpenEnquiryPage = () => {
  const [params, setParams] = useState(initialParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: enquiryData, isLoading } = useOpenEnquiryList(params);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
    },
    {
      title: "Event Date",
      dataIndex: "event_date",
      key: "event_date",
    },
    {
      title: "Tell Us More",
      dataIndex: "tellUsMore",
      key: "tellUsMore",
    },
  ];
  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Main content */}
        <div className="col-span-12 xl:col-span-12 space-y-6">
          {/* Title bar with actions */}
          <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="shrink-0">
                <BackButton />
              </Link>
              <h2 className="themeH1">Open Enquiry</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outlined" color="danger">
                Delete
              </Button>
              <Button type="default" className="themeDefaultButton">
                Email Update
              </Button>
              <Button
                type="default"
                className="themeDefaultButton"
                onClick={() => setModalOpen(true)}
              >
                Send Brochure
              </Button>
              <Button type="primary" className="themeDefaultButton">
                Send Quote
              </Button>
              <button className=" size-9 flex items-center justify-center rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-9 space-y-6">
          {/* Left side Enquiry table */}
          <Card variant="white" className="p-0 overflow-hidden">
            {/* Enquiry search bar */}
            <div className="bg-primary p-5">
              <div className="flex max-w-[385px] items-center gap-2 rounded-lg bg-white px-4 py-3">
                <MagnifyingGlass w={18} h={18} />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or event details..."
                  className="w-full bg-transparent! text-sm placeholder:text-gray-500"
                />
              </div>
            </div>
            <DataTable
              columns={columns}
              dataSource={enquiryData?.data}
              loading={isLoading}
              rowKey={(data) => data.id}
              pagination={{
                pageSize: params.limit,
                current: params.page,
                total: enquiryData?.meta.total,
                onChange: (page, pageSize) =>
                  setParams({ ...params, page, limit: pageSize }),
              }}
              rowSelection={rowSelection}
            />
          </Card>
          {/* Left side Enquiry table */}
        </div>
        <div className="col-span-12 xl:col-span-3 space-y-6">
          {/* Add input + Add button */}
          <div className="flex gap-2 h-[88px]">
            <input
              type="text"
              placeholder=""
              className="rounded-xl w-full border border-gray-200 px-3 text-sm outline-none bg-white!"
            />
            <Button type="primary" className="h-auto! w-[89px] shrink-0">
              Add
            </Button>
          </div>

          {/* Recent activities */}
          <Card variant="white" className="overflow-hidden">
            <div className="">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent activities
              </h3>
            </div>
            <div className="min-h-[120px] px-5 py-4 text-sm text-gray-500">
              {/* Empty state - list will populate here */}
            </div>
          </Card>

          {/* Deposit Received */}
          <div className="p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none">
                  <option>Company</option>
                </select>
                <input
                  type="text"
                  defaultValue="12/27/2025"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white! px-3 text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none">
                  <option>Amount</option>
                </select>
                <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none">
                  <option>Payment</option>
                </select>
              </div>
              <Button type="primary" className="w-full">
                Deposit Received
              </Button>
            </div>
          </div>
        </div>
      </div>
      {modalOpen && (
        <SendBrochureModal
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default OpenEnquiryPage;
