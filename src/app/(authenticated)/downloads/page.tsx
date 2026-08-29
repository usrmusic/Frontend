"use client";
import { useDeleteFile, useDownloadsList, useUploadMedia, useDownloadMedia } from "@/src/api/downloads";
import { Modal, message } from "antd";
import Button from "@/src/components/Button";
import AlertModal from "@/src/components/common/AlertModal";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { formatFileSize } from "@/src/utils/formatFileSize";
import { TableColumnsType } from "antd";
import { FileUp, Download, Trash2 } from "lucide-react";
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
  const uploadMedia = useUploadMedia();
  const { mutateAsync: getMediaUrl, isPending: isDownloading } = useDownloadMedia();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      render: (bytes: number) => formatFileSize(bytes),
    },
    {
      title: "Actions",
      key: "actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="small"
            type="text"
            showShadow={false}
            loading={isDownloading}
            onClick={async () => {
              try {
                const resp = await getMediaUrl(row.id);
                const url = resp?.url || resp?.download_url;
                if (!url) return message.error("Could not get download URL");
                const a = document.createElement("a");
                a.href = url;
                a.download = row?.display_name || `file-${row.id}`;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                a.remove();
              } catch {
                message.error("Download failed");
              }
            }}
          >
            <Download size={14} color="#719984" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            onClick={() => {
              setModalOpen(true);
              setFileId(row.id);
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
          <div className="flex items-center gap-2">
            <Button type="primary" icon={<FileUp size={14} />} onClick={() => setShowUploadModal(true)}>
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

      <Modal
        title="Upload Media"
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
        footer={null}
      >
        <div className="space-y-3">
          <input
            type="file"
            accept="*/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}>Cancel</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!selectedFile) return message.error("Please select a file");
                const fd = new FormData();
                fd.append("media", selectedFile);
                try {
                  await uploadMedia.mutateAsync(fd);
                  message.success("Uploaded");
                  setShowUploadModal(false);
                  setSelectedFile(null);
                } catch {
                  // error handled by hook
                }
              }}
              loading={uploadMedia.isPending}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DownloadsPage;
