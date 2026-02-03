"use client";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, Export, MagnifyingGlass } from "@/src/components/Icons";
import { TableColumnsType } from "antd";
import {
  Copy,
  Download,
  Eye,
  FileUp,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Link from "next/link";

const page = () => {
  const columns: TableColumnsType = [
    {
      title: "File Name",
      dataIndex: "fileName",
      key: "fileName",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Upload At",
      dataIndex: "uploadAt",
      key: "uploadAt",
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
          <Button size="small" type="text" showShadow={false}>
            <Eye size={14} color="#6A7282" />
          </Button>
          <Button size="small" type="text" showShadow={false}>
            <Download size={14} color="#6A7282" />
          </Button>
          <Button size="small" type="text" showShadow={false}>
            <Copy size={14} color="#6A7282" />
          </Button>
          <Button size="small" type="text" showShadow={false} color="danger">
            <Trash2 size={14} color="#6A7282" />
          </Button>
        </div>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      fileName: "example-document.pdf",
      type: "PDF",
      size: "124 KB",
      event: "23-08-2025 (Jagsdeep Singh Bhondal)",
      uploadAt: "25/03/2025 - (17:44)",
    },
    {
      key: "2",
      fileName: "presentation.pptx",
      type: "PPTX",
      size: "2.1 MB",
      event: "28-07-2025 (Amit Kumar)",
      uploadAt: "26/03/2025 - (09:13)",
    },
    {
      key: "3",
      fileName: "photo.jpg",
      type: "JPG",
      size: "813 KB",
      event: "10-06-2026 (Sara Lee)",
      uploadAt: "01/04/2025 - (12:36)",
    },
    {
      key: "4",
      fileName: "report.xlsx",
      type: "XLSX",
      size: "567 KB",
      event: "11-11-2026 (Carlos Romero)",
      uploadAt: "10/05/2025 - (15:20)",
    },
    {
      key: "5",
      fileName: "archive.zip",
      type: "ZIP",
      size: "4.2 MB",
      event: "31-12-2024 (Emily Chen)",
      uploadAt: "17/06/2025 - (08:45)",
    },
    {
      key: "6",
      fileName: "notes.txt",
      type: "TXT",
      size: "5 KB",
      event: "03-03-2025 (Rajat Kapoor)",
      uploadAt: "03/03/2025 - (14:02)",
    },
    {
      key: "7",
      fileName: "resume.docx",
      type: "DOCX",
      size: "103 KB",
      event: "15-05-2025 (Anya Singh)",
      uploadAt: "15/05/2025 - (17:05)",
    },
    {
      key: "8",
      fileName: "budget.csv",
      type: "CSV",
      size: "27 KB",
      event: "20-07-2025 (Brian Miller)",
      uploadAt: "19/06/2025 - (18:32)",
    },
    {
      key: "9",
      fileName: "music.mp3",
      type: "MP3",
      size: "3.9 MB",
      event: "29-08-2025 (Sidney Clark)",
      uploadAt: "29/08/2025 - (21:01)",
    },
    {
      key: "10",
      fileName: "design.psd",
      type: "PSD",
      size: "13.7 MB",
      event: "12-10-2025 (Gina Stone)",
      uploadAt: "12/10/2025 - (10:24)",
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
          <Button icon={<FileUp size={14} />}>Upload File</Button>
          <Button icon={<Export w={16} h={16} />}>Export Data</Button>
          <Button icon={<MoreVertical size={18} />}></Button>
        </div>
      </div>
      <div>
        <div className="bg-primary rounded-xl overflow-hidden p-4">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
            />
          </div>
        </div>
        <DataTable columns={columns} dataSource={data} pagination={false} />
      </div>
    </div>
  );
};

export default page;
