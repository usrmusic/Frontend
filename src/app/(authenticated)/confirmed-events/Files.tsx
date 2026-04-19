"use client";

import DataTable from "@/src/components/DataTable";
import Button from "@/src/components/Button";
import dayjs from "dayjs";
import { TableColumnsType } from "antd";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useDownloadUpload } from "@/src/api/upload";
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
};

const Files = ({ dataSource, isModifyMode = false }: FilesProps) => {
  const { mutateAsync: getDownloadUrl } = useDownloadUpload();
  const [downloadingId, setDownloadingId] = useState<number | string | null>(
    null,
  );

const handleDownload = async (row: ConfirmedEventFile) => {
  if (downloadingId === row.id) return;
  setDownloadingId(row.id);

  try {
    const data = await getDownloadUrl(row.id);

    const url = (data?.url || data?.download_url) as string | undefined;
    if (!url) {
      toast.error("Could not get download URL");
      return;
    }

    const filename =
      (data as any)?.filename ||
      row.original_name ||
      row.file_name.split("/").pop() ||
      "download";

    window.location.href = url;

    toast.success(`Downloading ${filename}`);
  } catch {
    toast.error("Download failed");
  } finally {
    setDownloadingId(null);
  }
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
      render: (row: ConfirmedEventFile) => (
        <Button
          size="small"
          type="text"
          showShadow={false}
          loading={downloadingId === row.id}
          onClick={() => handleDownload(row)}
        >
          <Download size={14} color="#6A7282" />
        </Button>
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
    </div>
  );
};

export default Files;