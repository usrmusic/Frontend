import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import Link from "next/link";

const enquiries = [
  {
    id: 1,
    name: "Sangeeta Kaushik",
    mobile: "07922629123",
    eventDate: "27/04/2024",
    tellUsMore:
      "Hi, I have a wedding booked at Borgo Seno'Anni near Siena, and looking for someone with",
    selected: true,
  },
  {
    id: 2,
    name: "Jasbir Singh",
    mobile: "",
    eventDate: "16/09/2024",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 3,
    name: "Dan Singh",
    mobile: "",
    eventDate: "28/09/2024",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 4,
    name: "Pand Kang",
    mobile: "",
    eventDate: "13/02/2025",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 5,
    name: "Parminder Kang",
    mobile: "",
    eventDate: "16/05/2025",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 6,
    name: "Parminder Kang",
    mobile: "",
    eventDate: "16/05/2025",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 7,
    name: "Shane Johri",
    mobile: "",
    eventDate: "28/02/2025",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 8,
    name: "Simon Basra",
    mobile: "",
    eventDate: "15/11/2024",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 9,
    name: "Hardeep Mann",
    mobile: "",
    eventDate: "24/07/2024",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 10,
    name: "Nick Singh",
    mobile: "",
    eventDate: "30/04/2025",
    tellUsMore: "",
    selected: false,
  },
  {
    id: 11,
    name: "Rajbinder Bains",
    mobile: "",
    eventDate: "08/08/2025",
    tellUsMore: "",
    selected: false,
  },
];

const OpenEnquiryPage = () => {
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
              <Button type="default" className="themeDefaultButton">
                Send Brochure
              </Button>
              <Button type="primary" className="themeDefaultButton">
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
            <div className="overflow-x-auto max-h-[calc(100vh-20px)] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                  <tr className="text-left font-semibold">
                    <th className="w-12 py-4 px-4"></th>
                    <th className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        Name
                        <span className="flex flex-col -space-y-1">
                          <ChevronUp size={14} className="opacity-60" />
                          <ChevronDown size={14} className="opacity-60" />
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-4">Mobile</th>
                    <th className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        Event Date
                        <span className="flex flex-col -space-y-1">
                          <ChevronUp size={14} className="opacity-60" />
                          <ChevronDown size={14} className="opacity-60" />
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        Tell us more
                        <span className="flex flex-col -space-y-1">
                          <ChevronUp size={14} className="opacity-60" />
                          <ChevronDown size={14} className="opacity-60" />
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`${
                        row.selected
                          ? "bg-primary/10"
                          : index % 2 === 0
                            ? "bg-white"
                            : "bg-secondary-50/60"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          defaultChecked={row.selected}
                          className="size-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {row.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {row.mobile || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {row.eventDate}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {row.tellUsMore || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {/* Left side Enquiry table */}
        </div>
        <div className="col-span-12 xl:col-span-3 space-y-6">
          {/* Add input + Add button */}
          <div className="flex gap-2 h-[88px]">
            <input
              type="text"
              placeholder=""
              className="rounded-xl w-full border border-gray-200 px-3 text-sm outline-none bg-white!"
            />
            <Button type="primary" className="h-auto! w-[89px] shrink-0">
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
            </div>
          </Card>

          {/* Deposit Received */}
          <div className="p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none">
                  <option>Company</option>
                </select>
                <input
                  type="text"
                  defaultValue="12/27/2025"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white! px-3 text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none">
                  <option>Amount</option>
                </select>
                <select className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none">
                  <option>Payment</option>
                </select>
              </div>
              <Button type="primary" className="w-full">
                Deposit Received
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenEnquiryPage;
