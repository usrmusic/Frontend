"use client";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { TableColumnsType } from "antd";
import { FileUp, Pen, Trash2 } from "lucide-react";
import Link from "next/link";

const page = () => {
  const columns: TableColumnsType = [
    {
      title: "File Name",
      dataIndex: "fileName",
      key: "fileName",
      width: "70%",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: () => (
        <div className="flex gap-2">
          <Button size="small" type="text" showShadow={false}>
            <Pen size={14} color="#719984" />
          </Button>
          <Button size="small" type="text" showShadow={false}>
            <Trash2 size={14} color="#E74C6C" />
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
    },
    {
      key: "2",
      fileName: "presentation.pptx",
      type: "PPTX",
      size: "2.1 MB",
    },
    {
      key: "3",
      fileName: "photo.jpg",
      type: "JPG",
      size: "813 KB",
    },
    {
      key: "4",
      fileName: "report.xlsx",
      type: "XLSX",
      size: "567 KB",
    },
    {
      key: "5",
      fileName: "archive.zip",
      type: "ZIP",
      size: "4.2 MB",
    },
    {
      key: "6",
      fileName: "notes.txt",
      type: "TXT",
      size: "5 KB",
    },
    {
      key: "7",
      fileName: "resume.docx",
      type: "DOCX",
      size: "103 KB",
    },
    {
      key: "8",
      fileName: "budget.csv",
      type: "CSV",
      size: "27 KB",
    },
    {
      key: "9",
      fileName: "music.mp3",
      type: "MP3",
      size: "3.9 MB",
    },
    {
      key: "10",
      fileName: "design.psd",
      type: "PSD",
      size: "13.7 MB",
    },
  ];
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
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
            />
          </div>
          <div className="max-w-[365px] w-full flex items-center gap-2">
            <Input type="file" className="bg-white!" />
            <Button type="primary" icon={<FileUp size={14} />}>
              Upload File
            </Button>
          </div>
        </div>
      </div>
      {/*
        Define the columns and data for the DataTable.
        Columns: File Name, Type, Size, Actions
      */}
      <DataTable columns={columns} dataSource={data} pagination={false} />
    </div>
  );
};

export default page;
