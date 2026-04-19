
"use client";

import DataTable from "@/src/components/DataTable";
import Button from "@/src/components/Button";
import dayjs from "dayjs";
import { TableColumnsType } from "antd";
import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useDownloadUpload } from "@/src/api/upload";
import { toast } from "react-toastify";

export type ConfirmedEventFile = {
  id: number | string;
  file_name: string;
  file_type: string;
  created_at: string;
  event_id: number | null;
  general: boolean;
  file_url?: string;
};

type FilesProps = {
  dataSource: ConfirmedEventFile[];
  isModifyMode?: boolean;
};

const Files = ({
  dataSource,
  isModifyMode = false,
}: FilesProps) => {
  const { mutate: downloadFile, isPending: isDownloading } = useDownloadUpload();
  const handleDownload = (row: ConfirmedEventFile) => {
    downloadFile(row.id, {
      onSuccess: (data) => {
        // Assuming the API returns a file or URL
        if (data?.file_url || data?.url || data?.download_url) {
          const link = document.createElement("a");
          link.href = data.file_url || data.url || data.download_url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          // `download` may be ignored for cross-origin signed URLs; open in new tab
          try {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (e) {
            // fallback: open window
            window.open(link.href, "_blank", "noopener,noreferrer");
          }
        } else {
          toast.success("Download initiated");
        }
      },
      onError: () => {
        toast.error("Download failed");
      },
    });
  };

  const columns: TableColumnsType = [
    {
      title: "File name",
      dataIndex: "file_name",
      key: "file_name",
    },
    {
      title: "Type",
      dataIndex: "file_type",
      key: "file_type",
    },
    {
      title: "Uploaded at",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).isValid() ? dayjs(date).format("DD-MM-YYYY") : "—",
    },
    {
      title: "Event",
      key: "event",
      render: (row) => (row.event_id ? row.event_id : row.general ? "General" : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (row) => (
        <Button
          size="small"
          type="text"
          showShadow={false}
          loading={isDownloading}
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
        dataSource={dataSource}
        pagination={false}
        rowKey={(row) => row.id}
      />
    </div>
  );
};

export default Files;