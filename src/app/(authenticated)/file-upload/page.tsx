"use client";
import { useUploadList } from "@/src/api/upload";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, Export, MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import dayjs from "dayjs";
import {
  Copy,
  Download,
  Eye,
  FileUp,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};
const FileUploadPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1000);

  const { data: uploadListData, isLoading } = useUploadList({
    ...params,
    search: debouncedSearch,
  });

  const columns: TableColumnsType = [
    {
      title: "File Name",
      dataIndex: "display_name",
      key: "file_name",
    },
    {
      title: "Type",
      dataIndex: "extension",
      key: "file_type",
    },
    {
      title: "Upload At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => <>{dayjs(date).format("DD-MM-YYYY")}</>,
    },
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: () => (
        <div className="flex gap-2">
          <Button size="small" type="text" showShadow={false}>
            <Eye size={14} color="#6A7282" />
          </Button>
          <Button size="small" type="text" showShadow={false}>
            <Download size={14} color="#6A7282" />
          </Button>
          <Button size="small" type="text" showShadow={false}>
            <Copy size={14} color="#6A7282" />
          </Button>
          <Button size="small" type="text" showShadow={false} color="danger">
            <Trash2 size={14} color="#6A7282" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="shrink-0">
            <BackButton />
          </Link>
          <h2 className="themeH1">File Upload</h2>
        </div>
        <div className="flex gap-3">
          <Button icon={<FileUp size={14} />}>Upload File</Button>
          <Button icon={<Export w={16} h={16} />}>Export Data</Button>
          <Button icon={<MoreVertical size={18} />}></Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="bg-primary rounded-xl overflow-hidden p-4">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3">
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
          columns={columns}
          dataSource={uploadListData?.data}
          loading={isLoading}
          pagination={{
            pageSize: params.perPage,
            current: params.page,
            total: uploadListData?.meta.total,
            onChange: (page, pageSize) =>
              setParams({ ...params, page, perPage: pageSize }),
          }}
          rowKey={(data) => data.id}
        />
      </div>
    </div>
  );
};

export default FileUploadPage;
