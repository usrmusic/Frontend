"use client";

import { Popconfirm, Table, type TableColumnsType, notification } from "antd";
import dayjs from "dayjs";
import { Trash2 } from "lucide-react";
import {
  useDeleteContract,
  useEventContracts,
  type ContractRow,
} from "@/src/api/contracts";

type Props = {
  eventId: number | string | null | undefined;
};

// Admin "Contract Files" table inside the Confirmed Events Contracts tab.
// Lists every signed contract for the event with view / download / delete
// actions. Mirrors Laravel's contract_files admin table.
export default function ContractFiles({ eventId }: Props) {
  const { data, isLoading } = useEventContracts(eventId ?? null);
  const deleteContract = useDeleteContract(eventId ?? null);

  if (!eventId) return null;

  const handleDelete = (id: number | string) => {
    deleteContract.mutate(id, {
      onSuccess: () => {
        notification.success({ message: "Contract deleted" });
      },
      onError: () => {
        notification.error({ message: "Could not delete contract" });
      },
    });
  };

  const columns: TableColumnsType<ContractRow> = [
    {
      title: "File name",
      dataIndex: "filename",
      key: "filename",
      render: (_v, row) => row.filename || "—",
    },
    {
      title: "Signed at",
      dataIndex: "signed_at",
      key: "signed_at",
      render: (v: string | null) =>
        v ? dayjs(v).format("DD MMM YYYY HH:mm") : "—",
    },
    {
      title: "View",
      key: "view",
      render: (_v, row) =>
        row.view_url ? (
          <a
            href={row.view_url}
            target="_blank"
            rel="noreferrer"
            className="underline text-blue-600"
          >
            View
          </a>
        ) : (
          "—"
        ),
    },
    {
      title: "Download",
      key: "download",
      render: (_v, row) =>
        row.download_url ? (
          <a
            href={row.download_url}
            target="_blank"
            rel="noreferrer"
            download
            className="underline text-blue-600"
          >
            Download
          </a>
        ) : (
          "—"
        ),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_v, row) => (
        <Popconfirm
          title="Delete this signed contract?"
          description="The PDF and signature will be removed."
          okText="Delete"
          okButtonProps={{ danger: true, loading: deleteContract.isPending }}
          onConfirm={() => handleDelete(row.id)}
        >
          <button
            title="Delete contract"
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={14} />
          </button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="border border-gray-200 rounded-md bg-white p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Contract files</h3>
        <span className="text-xs text-gray-500">
          {data?.length || 0} signed contract{(data?.length || 0) === 1 ? "" : "s"}
        </span>
      </div>
      <Table<ContractRow>
        size="small"
        columns={columns}
        dataSource={data || []}
        loading={isLoading}
        rowKey={(r) => String(r.id)}
        pagination={false}
        locale={{ emptyText: "No signed contracts yet" }}
      />
    </div>
  );
}
