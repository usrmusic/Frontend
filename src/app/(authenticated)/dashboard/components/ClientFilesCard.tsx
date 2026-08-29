"use client";
import { Skeleton } from "antd";
import { Download } from "lucide-react";
import { toast } from "react-toastify";
import Card from "@/src/components/Card";
import { useMyUploadList, useDownloadMyUpload } from "@/src/api/upload";

export default function ClientFilesCard() {
  const { data, isLoading } = useMyUploadList();
  const { mutateAsync: downloadFile, isPending: isDownloading } =
    useDownloadMyUpload();

  const files = data?.data ?? [];

  const handleDownload = async (id: number, fallbackName: string) => {
    try {
      const { blob, filename } = await downloadFile(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename !== "download" ? filename : fallbackName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  };

  return (
    <Card variant="white" className="p-4 flex flex-col h-full">
      <h4 className="mb-3 text-base font-semibold text-gray-900 flex items-center min-h-8">
        My Files
      </h4>
      {isLoading ? (
        <div className="w-full pt-3 flex items-center justify-center">
          <Skeleton active />
        </div>
      ) : !files.length ? (
        <div className="text-sm text-gray-500">No files available.</div>
      ) : (
        <ul className="space-y-2 no-scrollbar text-sm flex-1 max-h-[260px] overflow-auto">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between py-2 border-b border-[#636363]"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {f.file_name.split("/").pop()}
                </p>
                <p className="text-xs text-gray-400">
                  {f.created_at
                    ? new Date(f.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>
              <button
                type="button"
                title="Download"
                aria-label="Download"
                disabled={isDownloading}
                onClick={() =>
                  handleDownload(f.id, f.file_name.split("/").pop() || "file")
                }
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
