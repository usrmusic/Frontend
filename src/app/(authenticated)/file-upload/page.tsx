"use client";
import { useUploadList, useDownloadUpload, useDeleteUpload, useUpdateUpload, useUploadFile } from "@/src/api/upload";
import { Modal, message } from "antd";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const downloadMutation = useDownloadUpload();
  const deleteMutation = useDeleteUpload();
  const updateMutation = useUpdateUpload();
  const uploadMutation = useUploadFile();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFile, setEditingFile] = useState<any | null>(null);

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
          {/* <Button size="small" type="text" showShadow={false}>
            <Eye size={14} color="#6A7282" />
          </Button> */}
          <Button
            size="small"
            type="text"
            showShadow={false}
            onClick={async () => {
              try {
                const res = await downloadMutation.mutateAsync(upload.id);
                const url = res?.url || res?.download_url || res?.data?.download_url || res;
                if (!url) return message.error("No download URL");
                // trigger download
                const a = document.createElement("a");
                a.href = url;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                a.remove();
              } catch (e) {
                console.error(e);
              }
            }}
          >
            <Download size={14} color="#6A7282" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            onClick={() => {
              setEditingFile(upload);
              setShowEditModal(true);
            }}
          >
            <Copy size={14} color="#6A7282" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            color="danger"
            onClick={() => {
              Modal.confirm({
                title: "Delete file",
                content: "Are you sure you want to delete this file?",
                onOk: async () => {
                  if (!upload || !upload.id) return;
                  await deleteMutation.mutateAsync(upload.id);
                },
              });
            }}
          >
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
          <Button icon={<FileUp size={14} />} onClick={() => setShowUploadModal(true)}>Upload File</Button>
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
      {/* Edit metadata modal */}
      <Modal
        title="Edit File"
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
      >
        {editingFile && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget as HTMLFormElement);
              const file_name = form.get("display_name");
              if (!file_name) return message.error("Name required");
              await updateMutation.mutateAsync({ id: editingFile.id, data: { file_name } });
              setShowEditModal(false);
            }}
          >
            <label className="block text-xs mb-2">File name</label>
            <input name="display_name" defaultValue={editingFile.display_name} className="w-full mb-3 p-2 border" />
            <div className="text-right">
              <Button htmlType="submit" type="primary">Save</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Upload modal */}
      <Modal
        title="Upload File"
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget as HTMLFormElement);
            const file = f.get("file") as File | null;
            if (!file) return message.error("Please choose a file");
            await uploadMutation.mutateAsync(f);
            setShowUploadModal(false);
          }}
        >
          <label className="block text-xs mb-2">File</label>
          <input name="file" type="file" className="mb-3" />
          <label className="block text-xs mb-2">Display name</label>
          <input name="display_name" className="w-full mb-3 p-2 border" />
          <label className="block text-xs mb-2">Event ID (optional)</label>
          <input name="event_id" className="w-full mb-3 p-2 border" />
          <div className="text-right">
            <Button htmlType="submit" type="primary">Upload</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FileUploadPage;
