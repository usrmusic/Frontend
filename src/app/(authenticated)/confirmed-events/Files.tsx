
"use client";

import DataTable from "@/src/components/DataTable";
import Button from "@/src/components/Button";
import dayjs from "dayjs";
import { TableColumnsType } from "antd";
import { Download, Pen } from "lucide-react";

export type ConfirmedEventFile = {
  id: number | string;
  file_name: string;
  file_type: string;
  created_at: string;
  event_id: number | null;
  general: boolean;
};

type FilesProps = {
  dataSource: ConfirmedEventFile[];
  onDownload?: (row: ConfirmedEventFile) => void;
  onEdit?: (row: ConfirmedEventFile) => void;
};

const Files = ({
  dataSource,
  onDownload,
  onEdit,
}: FilesProps) => {
  const columns: TableColumnsType = [
    {
      title: "File name",
      dataIndex: "file_name",
      key: "file_name",
    },
    {
      title: "type",
      dataIndex: "file_type",
      key: "file_type",
    },
    {
      title: "uploaded at",
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
        <div className="flex gap-2">
          <Button
            size="small"
            type="text"
            showShadow={false}
            onClick={() => onDownload?.(row)}
          >
            <Download size={14} color="#6A7282" />
          </Button>
          <Button
            size="small"
            type="text"
            showShadow={false}
            onClick={() => onEdit?.(row)}
          >
            <Pen size={14} color="#6A7282" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      rowKey={(row) => row.id}
    />
  );
};

export default Files;