"use client";
import { useGetCompletedEventsList } from "@/src/api/events";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType, TableProps } from "antd";
import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const CompletedEventsPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1000);

  const { data: completedEventsData, isLoading } = useGetCompletedEventsList({
    ...params,
    search: debouncedSearch,
  });
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
      dataIndex: ["users_events_user_idTousers", "name"],
      title: "Name",
    },
    {
      key: "email",
      dataIndex: ["users_events_user_idTousers", "email"],
      title: "Email",
    },
    {
      key: "mobile",
      dataIndex: ["users_events_user_idTousers", "contact_number"],
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
      render: (date) => <>{dayjs(date).format("DD-MM-YYYY")}</>,
    },
    {
      key: "payment",
      dataIndex: "is_event_payment_fully_paid",
      title: "Payment",
      render: (data) => (
        <div
          className={`${data && "bg-[#D4F4DD]"} ${!data && "bg-[#FFF4CC] text-[#9C6F19]"} w-[98px] rounded-full text-center text-[#0F7B3B] py-1 text-xs capitalize`}
        >
          {data ? "Completed" : "Pending"}
        </div>
      ),
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
          {/* <div className="flex flex-wrap items-center gap-2">
            <Button>View</Button>
            <Button type="primary">Send Email</Button>
            <Button type="primary">Send Invoice</Button>
            <Button type="default">Download Invoice</Button>
            <Button type="default">Export Data</Button>
            <button className=" size-9 flex items-center justify-center rounded-lg bg-white hover:bg-secondary-200 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div> */}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* <select
            name="event"
            id="event"
            className="bg-white rounded-lg h-10 px-3 text-sm"
          >
            <option value="">Select Event</option>
            <option value="event one">event one</option>
          </select> */}
          <div className="flex max-w-[385px] items-center gap-2 rounded-lg bg-white px-4 h-10">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <DataTable
          rowSelection={rowSelection}
          columns={columns}
          rowKey={(data) => data.id}
          loading={isLoading}
          dataSource={completedEventsData?.data}
          pagination={{
            pageSize: params.perPage,
            current: params.page,
            total: completedEventsData?.meta.total,
            onChange: (page, pageSize) =>
              setParams({ ...params, page, perPage: pageSize }),
          }}
        />
      </div>
    </>
  );
};

export default CompletedEventsPage;
