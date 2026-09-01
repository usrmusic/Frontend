"use client";

import DataTable from "@/src/components/DataTable";
import Button from "@/src/components/Button";
import dayjs from "dayjs";
import { TableColumnsType, Modal, Input as AntInput } from "antd";
import { Download, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  useDownloadUpload,
  useUpdateUpload,
  useDeleteUpload,
} from "@/src/api/upload";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useState } from "react";

export type ConfirmedEventFile = {
  id: number | string;
  file_name: string;
  original_name?: string;
  file_type: string;
  created_at: string;
  event_id: number | null;
  general: boolean;
  file_url?: string;
};

type FilesProps = {
  dataSource: ConfirmedEventFile[] | undefined;
  isModifyMode?: boolean;
  eventId?: string | number;
};

const Files = ({ dataSource, isModifyMode = false, eventId }: FilesProps) => {
  const { mutateAsync: downloadFile } = useDownloadUpload();
  const { mutateAsync: updateFile } = useUpdateUpload();
  const { mutate: deleteFile } = useDeleteUpload();
  const queryClient = useQueryClient();

  const [downloadingId, setDownloadingId] = useState<number | string | null>(
    null,
  );
  const [renameRow, setRenameRow] = useState<ConfirmedEventFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const invalidateEvent = () => {
    if (eventId) {
      queryClient.invalidateQueries({
        queryKey: ["confirm-event", String(eventId)],
      });
    }
  };

  const handleDownload = async (row: ConfirmedEventFile) => {
    if (downloadingId === row.id) return;
    setDownloadingId(row.id);
    try {
      const { blob, filename } = await downloadFile(row.id);
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download =
        filename ||
        row.original_name ||
        row.file_name.split("/").pop() ||
        "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
      toast.success("File downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRenameClick = (row: ConfirmedEventFile) => {
    const displayName =
      row.original_name || row.file_name.split("/").pop() || row.file_name;
    setRenameRow(row);
    setRenameValue(displayName.replace(/\.[^/.]+$/, ""));
  };

  const handleRenameConfirm = async () => {
    if (!renameRow || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      const oldKey = renameRow.file_name;
      const folder = oldKey.includes("/")
        ? oldKey.substring(0, oldKey.lastIndexOf("/"))
        : "";
      const displayName =
        renameRow.original_name || oldKey.split("/").pop() || "";
      const ext = displayName.match(/\.[^/.]+$/)?.[0] || "";
      const newKey = folder
        ? `${folder}/${renameValue.trim()}${ext}`
        : `${renameValue.trim()}${ext}`;

      await updateFile({ id: renameRow.id, data: { file_name: newKey } });
      invalidateEvent();
      toast.success("File renamed");
      setRenameRow(null);
      setRenameValue("");
    } catch {
      toast.error("Rename failed");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = (row: ConfirmedEventFile) => {
    const displayName =
      row.original_name || row.file_name.split("/").pop() || "this file";
    Modal.confirm({
      icon: null,
      rootClassName: "usr-confirm-modal",
      title: "Delete File",
      content: `Are you sure you want to delete "${displayName}"? This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      centered: true,
      onOk() {
        deleteFile(row.id, {
          onSuccess: () => {
            invalidateEvent();
            toast.success("File deleted");
          },
        });
      },
    });
  };

  const columns: TableColumnsType<ConfirmedEventFile> = [
    {
      title: "File Name",
      key: "file_name",
      render: (row: ConfirmedEventFile) =>
        row.original_name || row.file_name.split("/").pop() || row.file_name,
    },
    {
      title: "Type",
      dataIndex: "file_type",
      key: "file_type",
      render: (type: string) => type || "—",
    },
    {
      title: "Uploaded At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) =>
        dayjs(date).isValid() ? dayjs(date).format("DD-MM-YYYY") : "—",
    },
    {
      title: "Event",
      key: "event",
      render: (row: ConfirmedEventFile) =>
        row.event_id ? row.event_id : row.general ? "General" : "—",
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (row: ConfirmedEventFile) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="small"
            type="text"
            showShadow={false}
            title="Rename"
            onClick={() => handleRenameClick(row)}
          >
            <Pencil size={14} color="#6A7282" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            title="Download"
            loading={downloadingId === row.id}
            onClick={() => handleDownload(row)}
          >
            <Download size={14} color="#6A7282" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            title="Delete"
            onClick={() => handleDelete(row)}
          >
            <Trash2 size={14} color="#ef4444" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {isModifyMode && (
        <Link href="/file-upload">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Add Files
          </Button>
        </Link>
      )}
      <DataTable
        columns={columns}
        dataSource={dataSource ?? []}
        pagination={false}
        rowKey={(row) => String(row.id)}
      />

      <Modal
        title="Rename File"
        open={!!renameRow}
        onOk={handleRenameConfirm}
        onCancel={() => {
          setRenameRow(null);
          setRenameValue("");
        }}
        confirmLoading={isRenaming}
        okText="Rename"
        centered
      >
        <AntInput
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={handleRenameConfirm}
          placeholder="Enter new file name"
          autoFocus
          className="mt-2"
        />
        <p className="mt-2 text-xs text-gray-400">
          The file extension will be preserved automatically.
        </p>
      </Modal>
    </div>
  );
};

export default Files;
