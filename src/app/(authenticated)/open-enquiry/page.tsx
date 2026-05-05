"use client";
import {
  useAddNote,
  useOpenEnquiryList,
  useUpdateEnquiry,
  useDeleteEnquiry,
} from "@/src/api/enquiry";
import { useConfirmEvent } from "@/src/api/events";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import DataTable from "@/src/components/DataTable";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { useFormik } from "formik";
import { Select, DatePicker, TableColumnsType } from "antd";
import type { TableRowSelection } from "antd/es/table/interface";
import dayjs from "dayjs";
import { MoreVertical, Check } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "antd";
import { useSearchParams } from "next/navigation";
import SendBrochureModal from "./SendBrochure";
import { toast } from "react-toastify";
import { fetchEmailTemplate } from "@/src/api/enquiry";
import { useCompanyDropdown } from "@/src/api/dropdown";
import Input from "@/src/components/Input";
// using Ant Design inputs for date/amount

const initialParams = {
  page: 1,
  limit: 10,
  search: "",
};

import type { OpenEnquiryList } from "@/src/api/enquiry";

interface CompanyOption {
  id: number | string;
  name: string;
}

const OpenEnquiryPage = () => {
  const [params, setParams] = useState(initialParams);
  const [modalOpen, setModalOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState<unknown | null>(null);
  const [modalCompanies, setModalCompanies] = useState<Array<{
    id: string | number;
    name: string;
  }> | null>(null);
  const [note, setNote] = useState("");
  const [flagLoading, setFlagLoading] = useState<Record<string, boolean>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRowData, setSelectedRowData] = useState<
    OpenEnquiryList[] | null
  >(null);
  const [clickedBtn, setClickedBtn] = useState<
    "brochure" | "quote" | "invoice"
  >("invoice");

  const { data: enquiryData, isLoading } = useOpenEnquiryList(params);
  const { data: companyNameOptions } = useCompanyDropdown();

  const { mutate: addNoteMutation } = useAddNote();
  const { mutate: confirmEventMutation, isPending: confirmingEvent } =
    useConfirmEvent();
  const updateEnquiry = useUpdateEnquiry();
  const deleteEnquiry = useDeleteEnquiry();
  const router = useRouter();

  // Memoize options to prevent unnecessary re-renders and fix TS mapping
  const companyOptions = useMemo(() => {
    const dynamicOptions =
      companyNameOptions?.data?.map((opt: CompanyOption) => ({
        label: opt.name,
        value: String(opt.id),
      })) || [];

    return [{ label: "Select company", value: "" }, ...dynamicOptions];
  }, [companyNameOptions]);

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

      // ensure event_date is a valid DD-MM-YYYY string (avoid 'Invalid Date')
      const formattedEventDate = values.event_date
        ? dayjs(values.event_date, "DD-MM-YYYY").format("DD-MM-YYYY")
        : "";

      confirmEventMutation(
        {
          id: String(selectedRowKeys[0]),
          payload: {
            company_name: String(values.company_name),
            event_date: formattedEventDate,
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
    rows: OpenEnquiryList[],
  ) => {
    setSelectedRowKeys(newSelectedRowKeys.map((key) => String(key)));
    setSelectedRowData(rows);
  };

  const rowSelection: TableRowSelection<OpenEnquiryList> = {
    type: "radio",
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns: TableColumnsType<OpenEnquiryList> = [
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
      render: (value: string) =>
        value ? dayjs(value).format("MM/DD/YYYY") : "-",
    },
    {
      title: "Tell Us More",
      dataIndex: "details",
      key: "details",
    },
  ];

  const hanldeAddNote = () => {
    if (!note.trim()) return;
    addNoteMutation(
      { id: Number(selectedRowKeys[0]), note },
      {
        onSuccess: () => {
          toast.success("Note Added Successfully");
          setNote("");
        },
      },
    );
  };

  // Keep selectedRowData in sync after data changes (so Recent Activities updates)
  useEffect(() => {
    if (!selectedRowKeys?.length) return;
    const id = String(selectedRowKeys[0]);
    const found = enquiryData?.data?.find((d) => String(d.id) === id) || null;
    if (found) setSelectedRowData([found]);
  }, [enquiryData, selectedRowKeys]);

  const toggleFlag = async (flag: string) => {
    if (!selectedRowKeys.length) return;
    const id = selectedRowKeys[0];
    const current = selectedRowData?.[0]?.[flag];
    // show loader for this flag
    setFlagLoading((s) => ({ ...s, [flag]: true }));

    // optimistic UI update
    setSelectedRowData((prev) => {
      if (!prev || !prev.length) return prev;
      return [{ ...prev[0], [flag]: !current } as OpenEnquiryList];
    });

    updateEnquiry.mutate(
      { id: String(id), body: { [flag]: !current } },
      {
        onSuccess: () => {
          toast.success("Updated");
          setFlagLoading((s) => ({ ...s, [flag]: false }));
        },
        onError: () => {
          toast.error("Failed to update");
          // revert optimistic update on error
          setSelectedRowData((prev) => {
            if (!prev || !prev.length) return prev;
            return [{ ...prev[0], [flag]: current } as OpenEnquiryList];
          });
          setFlagLoading((s) => ({ ...s, [flag]: false }));
        },
      },
    );
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const s = searchParams?.get("search") ?? "";
    const name = searchParams?.get("name") ?? "";
    if (!s) return;
    const displayValue = name || s;
    setParams((prev) => {
      if (prev.search === displayValue) return prev;
      return { ...prev, search: displayValue, page: 1 };
    });
  }, [searchParams]);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Main content wrapper */}
        <div className="col-span-12 space-y-6">
          <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="shrink-0">
                <BackButton />
              </Link>
              <h2 className="themeH1">Open Enquiry</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* <Button variant="outlined" disabled={!selectedRowKeys.length} color="danger">Delete</Button> */}
                            <Button
                type="default"
                className="themeDefaultButton"
                disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
                onClick={() => {
                  if (!selectedRowKeys.length) return;
                  router.push(`/enquiry?select=${encodeURIComponent(String(selectedRowKeys[0]))}`);
                }}
              >
                Edit
              </Button>
              <Button
                type="default"
                className="themeDefaultButton"
                disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
                loading={buttonLoading === "delete"}
                onClick={() => {
                  if (!selectedRowKeys.length) return;
                  Modal.confirm({
                    title: (
                      <div className="flex items-center gap-3">
                        <span className="text-red-600 text-xl">⚠️</span>
                        <span className="font-medium">Delete enquiry</span>
                      </div>
                    ),
                    content: (
                      <div className="text-sm text-gray-700">
                        Are you sure you want to delete this enquiry? This action cannot be undone. This will permanently remove the enquiry and related temporary data.
                      </div>
                    ),
                    centered: true,
                    maskClosable: false,
                    okText: "Delete",
                    okButtonProps: { danger: true, className: "!bg-red-600 !border-red-600 hover:!bg-red-700" },
                    cancelText: "Cancel",
                    onOk: () => {
                      const id = String(selectedRowKeys[0]);
                      setButtonLoading("delete");
                      deleteEnquiry.mutate(id, {
                        onSuccess: () => {
                          toast.success("Enquiry deleted");
                          setSelectedRowKeys([]);
                          setSelectedRowData(null);
                          setButtonLoading(null);
                        },
                        onError: () => {
                          setButtonLoading(null);
                        },
                      });
                    },
                  });
                }}
              >
                Delete
              </Button>
                <Button
                type="default"
                disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
                className="themeDefaultButton"
                loading={buttonLoading === "emailUpdate"}
                onClick={async () => {
                  if (!selectedRowKeys.length) return;
                  setButtonLoading("emailUpdate");
                  try {
                    const data = await fetchEmailTemplate(
                      String(selectedRowKeys[0]),
                      "EMAIL FOR UPDATE",
                    );
                    setModalTemplate(data?.email ?? null);
                    setModalCompanies(data?.companies ?? null);
                    setClickedBtn("brochure"); // use brochure API for now
                    setModalOpen(true);
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to load email template");
                  } finally {
                    setButtonLoading(null);
                  }
                }}
              >
                Email Update
              </Button>
              <Button
                type="default"
                className="themeDefaultButton"
                loading={buttonLoading === "brochure"}
                onClick={async () => {
                  if (!selectedRowKeys.length) return;
                  setButtonLoading("brochure");
                  try {
                    const data = await fetchEmailTemplate(
                      String(selectedRowKeys[0]),
                      "EMAIL BROCHURE",
                    );
                    setModalTemplate(data?.email ?? null);
                    setModalCompanies(data?.companies ?? null);
                    setClickedBtn("brochure");
                    setModalOpen(true);
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to load email template");
                  } finally {
                    setButtonLoading(null);
                  }
                }}
                disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
              >
                Send Brochure
              </Button>
              <Button
                type="primary"
                className="themeDefaultButton"
                disabled={!selectedRowKeys.length || Boolean(buttonLoading)}
                loading={buttonLoading === "quote"}
                onClick={async () => {
                  if (!selectedRowKeys.length) return;
                  setButtonLoading("quote");
                  try {
                    const data = await fetchEmailTemplate(
                      String(selectedRowKeys[0]),
                      "SEND QUOTE-OPEN",
                    );
                    setModalTemplate(data?.email ?? null);
                    setModalCompanies(data?.companies ?? null);
                    setClickedBtn("quote");
                    setModalOpen(true);
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to load email template");
                  } finally {
                    setButtonLoading(null);
                  }
                }}
              >
                Send Quote
              </Button>
              {/* <button className="size-9 flex items-center justify-center rounded-lg bg-secondary-100 hover:bg-secondary-200 transition-colors">
                <MoreVertical size={18} />
              </button> */}
            </div>
          </div>
        </div>

        {/* Left Section: Table */}
        <div className="col-span-12 xl:col-span-9 space-y-6">
          <Card variant="white" className="p-0 overflow-hidden shadow-sm">
            <div className="bg-primary p-5">
              <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 max-w-[300px]">
                <MagnifyingGlass w={18} h={18} />
                <input
                  type="text"
                  placeholder="Search by name, mobile..."
                  className="w-full bg-[#ffffff] outline-none text-sm placeholder:text-gray-400"
                  value={params.search}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      search: e.target.value,
                      page: 1,
                    }))
                  }
                />
              </div>
            </div>
            <DataTable<OpenEnquiryList>
              columns={columns}
              dataSource={enquiryData?.data}
              loading={isLoading}
              rowKey={(data) => String(data.id)}
              pagination={{
                pageSize: params.limit,
                current: params.page,
                total: enquiryData?.meta?.total,
                onChange: (page, pageSize) =>
                  setParams({ ...params, page, limit: pageSize }),
              }}
              rowSelection={rowSelection}
              onRow={(record) => ({
                onClick: () => {
                  try {
                    const id = record?.id;
                    if (!id) return;
                    setSelectedRowKeys([String(id)]);
                    setSelectedRowData([record]);
                  } catch {}
                },
              })}
            />
          </Card>
        </div>

        {/* Right Section: Sidebar Actions */}
        <div className="col-span-12 xl:col-span-3 space-y-6">
          {/* Notes Card */}
          <Card
            variant="white"
            className="flex flex-col shadow-sm overflow-hidden p-0"
          >
            <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
              <h3 className="font-medium">Recent Activities</h3>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note..."
                  className="flex-1 rounded-lg border border-gray-200 p-2 text-xs outline-none bg-gray-50 focus:bg-white focus:border-primary transition-all"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  type="primary"
                  className="h-9 w-16 shrink-0 rounded-lg text-xs"
                  onClick={hanldeAddNote}
                  disabled={!selectedRowKeys.length || !note.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="p-4 min-h-[150px] max-h-[250px] overflow-y-auto">
              {selectedRowData?.[0]?.event_notes?.length ? (
                <ul className="space-y-3">
                  {selectedRowData[0].event_notes?.map((item) => (
                    <li
                      key={item.id}
                      className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border-l-4 border-primary"
                    >
                      {item.notes}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                  Select an enquiry to see notes
                </div>
              )}
            </div>
          </Card>

          {/* Deposit Form Card */}
          <Card variant="white" className="p-0 shadow-sm overflow-hidden ">
            <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
              <h3 className="font-medium">Confirm Deposit</h3>
            </div>
            <div className="px-6 py-5">
              <form className="space-y-3" onSubmit={formik.handleSubmit}>
                <div className="grid grid-cols-1 gap-3">
                  <Select
                    className="w-full custom-select"
                    placeholder="Select company"
                    options={companyOptions}
                    value={formik.values.company_name || undefined}
                    onChange={(value) =>
                      formik.setFieldValue("company_name", value)
                    }
                  />
                  <DatePicker
                    placeholder="Payment date"
                    className="w-full text-xs"
                    format="DD-MM-YYYY"
                    value={
                      formik.values.event_date
                        ? dayjs(formik.values.event_date, "DD-MM-YYYY")
                        : undefined
                    }
                    onChange={(val) =>
                      formik.setFieldValue(
                        "event_date",
                        val ? dayjs(val).format("DD-MM-YYYY") : "",
                      )
                    }
                    allowClear
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    name="deposit_amount"
                    type="number"
                    placeholder="Amount"
                    className="w-full text-xs bg-white!"
                    value={formik.values.deposit_amount}
                    onChange={formik.handleChange}
                  />
                  <select
                    name="payment_method_id"
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-xs outline-none focus:border-primary"
                    value={formik.values.payment_method_id}
                    onChange={formik.handleChange}
                  >
                    <option value="" disabled>
                      Payment method
                    </option>
                    <option value="1">Cash</option>
                    <option value="2">Bank Transfer</option>
                    <option value="3">Card</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { key: "brochure_emailed", label: "Brochure emailed?" },
                    { key: "called", label: "Called?" },
                    { key: "send_media", label: "Send media?" },
                    { key: "quoted", label: "Quoted?" },
                  ].map((f) => {
                    const enabled = Boolean(selectedRowData?.[0]?.[f.key]);
                    const loading = Boolean(flagLoading[f.key]);
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => toggleFlag(f.key)}
                        className={`flex items-center justify-between gap-3 px-2 py-2 rounded-lg border transition-colors text-sm ${
                          enabled
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-700 border-gray-200"
                        }`}
                        disabled={!selectedRowKeys.length || loading}
                      >
                        <span>{f.label}</span>
                        <span className="flex items-center">
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : enabled ? (
                            <span className="w-6 h-6 rounded-full flex items-center justify-center bg-primary border border-primary">
                              <Check size={12} className="text-white" />
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-transparent">
                              <span className="w-2 h-2 rounded-full bg-gray-300" />
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  type="primary"
                  className="w-full h-10 mt-2 font-semibold"
                  htmlType="submit"
                  loading={confirmingEvent}
                  disabled={!selectedRowKeys.length}
                >
                  Confirm Booking
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {modalOpen && (
        <SendBrochureModal
          open={modalOpen}
          sendMode={clickedBtn}
          eventId={String(selectedRowKeys[0])}
          template={
            modalTemplate as {
              id?: string;
              email_name?: string;
              subject?: string;
              body?: string;
            } | null
          }
          companies={modalCompanies}
          onCancel={() => {
            setModalOpen(false);
            setButtonLoading(null);
            setModalTemplate(null);
            setModalCompanies(null);
          }}
        />
      )}
    </div>
  );
};

export default OpenEnquiryPage;
