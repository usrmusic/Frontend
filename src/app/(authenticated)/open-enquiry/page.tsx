"use client";
import { useAddNote, useOpenEnquiryList } from "@/src/api/enquiry";
import { useConfirmEvent } from "@/src/api/events";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { useFormik } from "formik";
import { Select, TableColumnsType } from "antd";
import { TableRowSelection } from "antd/es/table/interface";
import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SendBrochureModal from "./SendBrochure";
import { toast } from "react-toastify";
import { useCompanyDropdown } from "@/src/api/dropdown";
import Input from "@/src/components/Input";

const initialParams = {
  page: 1,
  limit: 10,
  search: "",
};

interface EventNote {
  id: number;
  notes: string;
}

interface EnquiryRow {
  id: number | string;
  event_notes?: EventNote[];
}

interface CompanyOption {
  id: number | string;
  name: string;
}

const OpenEnquiryPage = () => {
  const [params, setParams] = useState(initialParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRowData, setSelectedRowData] = useState<EnquiryRow[] | null>(
    null,
  );
  const [clickedBtn, setClickedBtn] = useState<
    "brochure" | "quote" | "invoice"
  >("invoice");

  const { data: enquiryData, isLoading } = useOpenEnquiryList(params);
  const { data: companyNameOptions } = useCompanyDropdown();

  const { mutate: addNoteMutation } = useAddNote();
  const { mutate: confirmEventMutation, isPending: confirmingEvent } =
    useConfirmEvent();

  const formik = useFormik({
    initialValues: {
      company_name: "",
      event_date: "",
      deposit_amount: "",
      payment_method_id: "",
    },
    onSubmit: (values, { resetForm }) => {
      if (!selectedRowKeys.length) {
        toast.error("Please select an enquiry first");
        return;
      }

      confirmEventMutation(
        {
          id: String(selectedRowKeys[0]),
          payload: {
            company_name: String(values.company_name),
            event_date: dayjs(values.event_date).format("DD-MM-YYYY"),
            deposit_amount: Number(values.deposit_amount),
            payment_method_id: Number(values.payment_method_id),
          },
        },
        {
          onSuccess: () => {
            toast.success("Deposit added successfully");
            resetForm();
          },
        },
      );
    },
  });

  const onSelectChange = (
    newSelectedRowKeys: React.Key[],
    rows: Record<string, unknown>[],
  ) => {
    setSelectedRowKeys(newSelectedRowKeys);
    setSelectedRowData((rows as unknown as EnquiryRow[]) ?? null);
  };
  console.log(selectedRowData);

  const rowSelection: TableRowSelection = {
    type: "radio",
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns: TableColumnsType = [
    {
      title: "Name",
      dataIndex: ["users_events_user_idTousers", "name"],
      key: "name",
    },
    {
      title: "Mobile",
      dataIndex: ["users_events_user_idTousers", "contact_number"],
      key: "mobile",
    },
    {
      title: "Event Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Tell Us More",
      dataIndex: "details",
      key: "details",
    },
  ];

  const hanldeAddNote = () => {
    addNoteMutation(
      { id: selectedRowKeys[0] as number, note },
      {
        onSuccess: () => {
          toast.success("Note Added Successfully");
          setNote("");
        },
      },
    );
  };
  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Main content */}
        <div className="col-span-12 xl:col-span-12 space-y-6">
          {/* Title bar with actions */}
          <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="shrink-0">
                <BackButton />
              </Link>
              <h2 className="themeH1">Open Enquiry</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outlined" color="danger">
                Delete
              </Button>
              <Button type="default" className="themeDefaultButton">
                Email Update
              </Button>
              <Button
                type="default"
                className="themeDefaultButton"
                onClick={() => {
                  setModalOpen(true);
                  setClickedBtn("brochure");
                }}
                disabled={!selectedRowKeys.length}
              >
                Send Brochure
              </Button>
              <Button
                type="primary"
                className="themeDefaultButton"
                disabled={!selectedRowKeys.length}
                onClick={() => {
                  setModalOpen(true);
                  setClickedBtn("quote");
                }}
              >
                Send Quote
              </Button>
              <button className=" size-9 flex items-center justify-center rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-9 space-y-6">
          {/* Left side Enquiry table */}
          <Card variant="white" className="p-0 overflow-hidden">
            {/* Enquiry search bar */}
            <div className="bg-primary p-5">
              <div className="flex max-w-[385px] items-center gap-2 rounded-lg bg-white px-4 py-3">
                <MagnifyingGlass w={18} h={18} />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or event details..."
                  className="w-full bg-transparent! text-sm placeholder:text-gray-500"
                />
              </div>
            </div>
            <DataTable
              columns={columns}
              dataSource={enquiryData?.data}
              loading={isLoading}
              rowKey={(data) => data.id}
              pagination={{
                pageSize: params.limit,
                current: params.page,
                total: enquiryData?.meta.total,
                onChange: (page, pageSize) =>
                  setParams({ ...params, page, limit: pageSize }),
              }}
              rowSelection={rowSelection}
            />
          </Card>
          {/* Left side Enquiry table */}
        </div>
        <div className="col-span-12 xl:col-span-3 space-y-6">
          {/* Add input + Add button */}
          <div className="flex gap-2 h-[88px]">
            <input
              type="text"
              placeholder="Enter Note"
              className="rounded-xl w-full border border-gray-200 px-3 text-sm outline-none bg-white!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              type="primary"
              className="h-auto! w-[89px] shrink-0"
              onClick={hanldeAddNote}
              disabled={!selectedRowKeys.length}
            >
              Add
            </Button>
          </div>

          {/* Recent activities */}
          <Card variant="white" className="overflow-hidden">
            <div className="">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent activities
              </h3>
            </div>
            <div className="min-h-[120px] px-5 py-4 text-sm text-gray-500">
              {/* Empty state - list will populate here */}
              <ul className="list-disc">
                {selectedRowData?.[0].event_notes?.map(
                  (note: { id: number; notes: string }) => (
                    <li key={note.id}>{note.notes}</li>
                  ),
                )}
              </ul>
            </div>
          </Card>

          {/* Deposit Received */}
          <div className="p-5">
            <form className="space-y-4" onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  className="w-full"
                  placeholder="Select company"
                  options={companyNameOptions?.data?.map((opt: CompanyOption) => ({
                    label: opt.name,
                    value: opt.id,
                  }))}
                  value={formik.values.company_name}
                  onChange={(value) =>
                    formik.setFieldValue("company_name", value)
                  }
                />
                <Input
                  name="event_date"
                  type="date"
                  value={formik.values.event_date}
                  onChange={formik.handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="deposit_amount"
                  type="number"
                  placeholder="Deposit Amount"
                  value={formik.values.deposit_amount}
                  onChange={formik.handleChange}
                />
                <select
                  name="payment_method_id"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none"
                  value={formik.values.payment_method_id}
                  onChange={formik.handleChange}
                >
                  <option value="">Payment</option>
                  <option value="1">Cash</option>
                  <option value="2">Bank Transfer</option>
                  <option value="3">Card</option>
                </select>
              </div>
              <Button
                type="primary"
                className="w-full"
                htmlType="submit"
                loading={confirmingEvent}
                disabled={!selectedRowKeys.length}
              >
                Add Deposit
              </Button>
            </form>
          </div>
        </div>
      </div>
      {modalOpen && (
        <SendBrochureModal
          open={modalOpen}
          sendMode={clickedBtn}
          eventId={selectedRowKeys[0] as string}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default OpenEnquiryPage;
