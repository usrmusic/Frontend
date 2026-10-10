"use client";
import {
  useUploadList,
  useDownloadUpload,
  useDeleteUpload,
  useUpdateUpload,
} from "@/src/api/upload";
import { Modal, message } from "antd";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, Export, MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import dayjs from "dayjs";
import { Download, FileUp, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Input from "@/src/components/Input";
import UploadFileModal from "@/src/components/common/UploadFileModal";
import { CSVLink } from "react-csv";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

/** Row shape from uploads list — used when editing metadata */
type UploadListRow = {
  id: number | string;
  file_name: string;
};

const FileUploadPage = () => {
  const [params, setParams] = useState(initialParams);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1000);

  const { data: uploadListData, isLoading } = useUploadList({
    ...params,
    search: debouncedSearch,
  });

  const downloadMutation = useDownloadUpload();
  const deleteMutation = useDeleteUpload();
  const updateMutation = useUpdateUpload();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFile, setEditingFile] = useState<UploadListRow | null>(null);


  const columns: TableColumnsType = [
    {
      title: "File Name",
      dataIndex: "file_name",
      key: "file_name",
      width: 260,
      ellipsis: true,
      render: (name: string) => {
        const base = name?.split("/").pop() || name;
        // Strip everything up to and including the first underscore — same
        // rule Laravel's file list uses (`/^[^_]*_/`), so the stripping
        // logic matches exactly, not just the visible result.
        return base?.replace(/^[^_]*_/, "") || base;
      },
    },
    {
      title: "Type",
      dataIndex: "file_type",
      key: "file_type",
      width: 140,
      render: (type: string) => (
        <span className="whitespace-nowrap">{type}</span>
      ),
    },
    {
      title: "Uploaded At",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (upload) => (
        <div className="flex gap-1">
          <Button
            size="small"
            type="text"
            showShadow={false}
            title="Download"
            onClick={async () => {
              try {
                const { blob, filename } = await downloadMutation.mutateAsync(
                  upload.id,
                );
                const objectUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = filename || upload.file_name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(objectUrl);
              } catch {
                message.error("Download failed");
              }
            }}
          >
            <Download size={14} color="#6A7282" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            title="Rename"
            onClick={() => {
              setEditingFile(upload as UploadListRow);
              setShowEditModal(true);
            }}
          >
            <Pencil size={14} color="#6A7282" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            title="Delete"
            onClick={() => {
              Modal.confirm({
      icon: null,
                rootClassName: "usr-confirm-modal",
                title: "Delete file",
                content: "Are you sure you want to delete this file?",
                okButtonProps: {
                  type: "primary",
                  className: "!bg-primary !border-primary hover:!opacity-90",
                },
                onOk: async () => {
                  if (!upload?.id) return;
                  await deleteMutation.mutateAsync(upload.id);
                },
              });
            }}
          >
            <Trash2 size={14} color="#ef4444" />
          </Button>
        </div>
      ),
    },
  ];

  const csvHeaders = [
    { label: "File Name", key: "file_name" },
    { label: "Type", key: "file_type" },
    { label: "Upload At", key: "created_at" },
    { label: "Event", key: "event" },
  ];
  const csvData = uploadListData?.data.map((row) => ({
    file_name: row.file_name,
    file_type: row.file_type,
    created_at: dayjs(row.created_at).format("DD-MM-YYYY"),
    event: row.event,
  }));

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="shrink-0">
          <BackButton />
        </Link>
        <h2 className="themeH1">File Upload</h2>
      </div>
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full sm:max-w-[410px] items-center gap-2 rounded-lg bg-white px-4 py-3">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CSVLink
              data={csvData ?? []}
              filename="file-upload.csv"
              headers={csvHeaders}
            >
              <Button icon={<Export w={16} h={16} />}>Export Data</Button>
            </CSVLink>
            <Button
              type="primary"
              icon={<FileUp size={14} />}
              onClick={() => {
                setShowUploadModal(true);
              }}
            >
              Upload File
            </Button>
          </div>
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
      {/* Edit metadata modal */}
      <Modal
        title="Edit File"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingFile(null);
        }}
        footer={null}
      >
        {editingFile && (
          <form
            key={editingFile.id}
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget as HTMLFormElement);
              const file_name = form.get("file_name");
              if (!file_name) return message.error("Name required");
              await updateMutation.mutateAsync({
                id: editingFile.id,
                data: { file_name },
              });
              setShowEditModal(false);
              setEditingFile(null);
            }}
          >
            <Input name="file_name" defaultValue={editingFile.file_name} />
            <div className="text-right mt-3">
              <Button
                htmlType="submit"
                type="primary"
                loading={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <UploadFileModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
};

export default FileUploadPage;
