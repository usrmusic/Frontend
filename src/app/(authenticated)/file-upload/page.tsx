"use client";
import {
  useUploadList,
  useDownloadUpload,
  useDeleteUpload,
  useUpdateUpload,
  useUploadFile,
} from "@/src/api/upload";
import { Checkbox, Modal, Select, message } from "antd";
import Button from "@/src/components/Button";
import DataTable from "@/src/components/DataTable";
import { BackButton, Export, MagnifyingGlass } from "@/src/components/Icons";
import { useDebounce } from "@/src/hooks/useDebounce";
import { TableColumnsType } from "antd";
import dayjs from "dayjs";
import { Download, FileUp, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormik } from "formik";
import Input from "@/src/components/Input";
import { useConfirmEventsDropdown } from "@/src/api/dropdown";
import { EventsDropdownItem } from "@/src/types/types";
import { CSVLink } from "react-csv";

const initialParams = {
  page: 1,
  perPage: 10,
  search: "",
};

type UploadFormValues = {
  file: File | null;
  delete_after: string;
  event_id: number | undefined;
  general: boolean;
};

const uploadFormInitialValues: UploadFormValues = {
  file: null,
  event_id: undefined,
  general: false,
  delete_after: "",
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
  const { data: eventsDropdown } = useConfirmEventsDropdown();

  // Soonest event first — matches the same "date order from today" ordering
  // used elsewhere (e.g. confirmed-events' own event picker).
  const eventDropdownOptions = (eventsDropdown?.data as EventsDropdownItem[])
    ?.slice()
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    .map((item) => ({
      label: `${dayjs(item.date).format("DD/MM/YYYY")} - ${item.venues?.venue} (${item.users_events_user_idTousers?.name})`,
      value: item.id,
    }));

  const downloadMutation = useDownloadUpload();
  const deleteMutation = useDeleteUpload();
  const updateMutation = useUpdateUpload();
  const uploadMutation = useUploadFile();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFile, setEditingFile] = useState<UploadListRow | null>(null);
  const [uploadFileInputKey, setUploadFileInputKey] = useState(0);

  const uploadFormik = useFormik<UploadFormValues>({
    initialValues: uploadFormInitialValues,
    validateOnChange: true,
    validate: (values) => {
      const errors: Partial<Record<keyof UploadFormValues, string>> = {};
      if (!values.file) errors.file = "Please choose a file";
      if (!values.general && values.event_id == null) {
        errors.event_id = "Please select an event";
      }
      return errors;
    },
    onSubmit: async (values, { resetForm }) => {
      const formData = new FormData();
      formData.append("file", values.file as File);
      if (values.event_id !== undefined) {
        formData.append("event_id", String(values.event_id));
      }
      if (values.general) {
        formData.append("general", "true");
      }
      if (values.delete_after) {
        // API-friendly date (YYYY-MM-DD from native date input)
        formData.append(
          "delete_after",
          dayjs(values.delete_after).format("YYYY-MM-DD"),
        );
      }
      await uploadMutation.mutateAsync(formData);
      resetForm();
      setUploadFileInputKey((k) => k + 1);
      setShowUploadModal(false);
    },
  });

  const resetUploadForm = () => {
    uploadFormik.resetForm();
    setUploadFileInputKey((k) => k + 1);
  };

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
        <div className="flex items-center justify-between">
          <div className="flex max-w-[410px] items-center gap-2 rounded-lg bg-white px-4 py-3">
            <MagnifyingGlass w={18} h={18} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent! text-sm placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
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
                resetUploadForm();
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

      {/* Upload modal */}
      <Modal
        title="Upload File"
        open={showUploadModal}
        onCancel={() => {
          resetUploadForm();
          setShowUploadModal(false);
        }}
        footer={null}
      >
        <form className="space-y-4" onSubmit={uploadFormik.handleSubmit}>
          <Input
            key={uploadFileInputKey}
            name="file"
            type="file"
            label="Choose file"
            // Native file inputs can't have their button text changed
            // (that's controlled by the browser), but the surrounding label
            // and the filename text next to it can be — flex/items-center
            // keeps the "no file chosen" text vertically centered in the
            // box instead of sitting at the top.
            className="flex items-center file:mr-3 file:h-full file:border-0 file:bg-secondary-200 file:px-3 file:text-sm file:text-gray-700 file:cursor-pointer"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0] ?? null;
              uploadFormik.setFieldValue("file", file);
            }}
            onBlur={uploadFormik.handleBlur}
            error={
              uploadFormik.touched.file && uploadFormik.errors.file
                ? uploadFormik.errors.file
                : undefined
            }
          />
          <div>
            <label className="mb-1 block text-xs">Event</label>
            <Select
              className="w-full bg-secondary-100!"
              placeholder="Select event"
              options={eventDropdownOptions}
              allowClear
              disabled={uploadFormik.values.general}
              status={
                uploadFormik.touched.event_id && uploadFormik.errors.event_id
                  ? "error"
                  : undefined
              }
              value={uploadFormik.values.event_id}
              onChange={(value) => {
                uploadFormik.setFieldValue(
                  "event_id",
                  value == null ? undefined : Number(value),
                );
              }}
              onBlur={() => uploadFormik.setFieldTouched("event_id", true)}
            />
            {uploadFormik.touched.event_id && uploadFormik.errors.event_id ? (
              <p className="mt-1 text-xs text-red-500">
                {uploadFormik.errors.event_id}
              </p>
            ) : null}
          </div>
          <Input
            type="date"
            name="delete_after"
            label="Delete after"
            value={uploadFormik.values.delete_after}
            onChange={(e) =>
              uploadFormik.setFieldValue("delete_after", e.target.value)
            }
            onBlur={uploadFormik.handleBlur}
          />
          <Checkbox
            checked={uploadFormik.values.general}
            onChange={(e) => {
              const checked = e.target.checked;
              uploadFormik.setFieldValue("general", checked);
              if (checked) {
                uploadFormik.setFieldValue("event_id", undefined);
              }
            }}
          >
            General
          </Checkbox>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                resetUploadForm();
                setShowUploadModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              loading={uploadMutation.isPending || uploadFormik.isSubmitting}
            >
              Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FileUploadPage;
