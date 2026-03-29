"use client";
import { useDeleteFile, useDownloadsList } from "@/src/api/downloads";
import Button from "@/src/components/Button";
import AlertModal from "@/src/components/common/AlertModal";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import { FileUp, Pen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

const DownloadsPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const [fileId, setFileId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 1000);

  const { data: downloadsData, isLoading } = useDownloadsList({
    ...params,
    search: debouncedSearch,
  });

  const deleteFile = useDeleteFile();
  const columns: TableColumnsType = [
    {
      title: "File Name",
      dataIndex: "display_name",
      key: "fileName",
      width: "70%",
    },
    {
      title: "Type",
      dataIndex: "extension",
      key: "extension",
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Actions",
      key: "actions",
      render: (data) => (
        <div className="flex gap-2">
          <Button size="small" type="text" showShadow={false}>
            <Pen size={14} color="#719984" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            onClick={() => {
              setModalOpen(true);
              setFileId(data.id);
            }}
          >
            <Trash2 size={14} color="#E74C6C" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = () => {
    deleteFile.mutate(fileId, {
      onSuccess: () => setModalOpen(false),
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="shrink-0">
          <BackButton />
        </Link>
        <h2 className="themeH1">Downloads</h2>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <div className="flex max-w-[410px] items-center gap-2 rounded-lg bg-white px-4 py-3">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
            />
          </div>
          <div className="max-w-[365px] w-full flex items-center gap-2">
            <Input type="file" className="bg-white!" />
            <Button type="primary" icon={<FileUp size={14} />}>
              Upload File
            </Button>
          </div>
        </div>
      </div>
      {/*
        Define the columns and data for the DataTable.
        Columns: File Name, Type, Size, Actions
      */}
      <DataTable
        columns={columns}
        dataSource={downloadsData?.data}
        loading={isLoading}
        pagination={{
          pageSize: params.perPage,
          current: params.page,
          total: downloadsData?.meta.total,
          onChange: (page, pageSize) =>
            setParams({ ...params, page, perPage: pageSize }),
        }}
        rowKey={(data) => data.id}
      />
      <AlertModal
        open={modalOpen}
        text="Are you sure you want to delete this file?"
        handleCancel={() => setModalOpen(false)}
        onYes={handleDelete}
        title="Delete File"
        loading={deleteFile.isPending}
      />
    </div>
  );
};

export default DownloadsPage;
