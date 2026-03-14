"use client";
import { useVenues } from "@/src/api/usersApi";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import { useState } from "react";
import VenueModal from "./VenueModal";
import { Pencil } from "lucide-react";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const VenuesPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [venueItem, setVenueItem] = useState(null);

  const debouncedSearch = useDebounce(search, 1000);
  const { data: venueData, isLoading } = useVenues({
    ...params,
    search: debouncedSearch,
  });

  const handleCancel = () => {
    setVenueItem(null);
    setModalOpen(false);
  };
  const columns: TableColumnsType = [
    {
      title: "Venue",
      dataIndex: "venue",
      key: "venue",
    },
    // {
    //   title: "Address",
    //   dataIndex: "address",
    //   key: "address",
    // },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
    },
    {
      title: "Power",
      dataIndex: "power",
      key: "power",
    },
    {
      title: "Access",
      dataIndex: "access",
      key: "access",
    },
    // {
    //   title: "Smoke Note",
    //   dataIndex: "smokeNote",
    //   key: "smokeNote",
    // },
    // {
    //   title: "Rigging Point",
    //   dataIndex: "riggingPoint",
    //   key: "riggingPoint",
    // },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
    },
    {
      title: "Action",
      render: (data) => (
        <button
          onClick={() => {
            setModalOpen(true);
            setVenueItem(data);
          }}
        >
          <Pencil size={14} />
        </button>
      ),
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
            <Button>Remove</Button>
            <Button>Deleted Users</Button>
            <Button>Export Data</Button>
          </div>
        </div>
      </Card>
      {/* Data Table  */}
      <DataTable
        columns={columns}
        dataSource={venueData?.data}
        loading={isLoading}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: venueData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        rowKey={(data) => data.id}
      />
      <VenueModal
        modalOpen={modalOpen}
        onCancel={handleCancel}
        initialValues={venueItem}
      />
    </div>
  );
};

export default VenuesPage;
