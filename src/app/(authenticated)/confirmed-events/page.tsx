"use client";
import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import Input from "@/src/components/Input";
import { Collapse, CollapseProps } from "antd";
import {
  ChevronDown,
  FileText,
  FolderOpen,
  MoreVertical,
  SquareCheckBig,
} from "lucide-react";
import Link from "next/link";
import { CSSProperties } from "react";

const page = () => {
  const getItems: (panelStyle: CSSProperties) => CollapseProps["items"] = (
    panelStyle,
  ) => [
    {
      key: "1",
      label: (
        <div className="flex items-center gap-1">
          <FileText size={14} />
          Contracts
        </div>
      ),
      children: <p>{"text"}</p>,
      style: panelStyle,
    },
    {
      key: "2",
      label: (
        <div className="flex items-center gap-1">
          <FolderOpen size={14} />
          Files
        </div>
      ),
      children: <p>{"text"}</p>,
      style: panelStyle,
    },
    {
      key: "3",
      label: (
        <div className="flex items-center gap-1">
          <SquareCheckBig size={14} />
          To do List
        </div>
      ),
      children: <p>{"text"}</p>,
      style: panelStyle,
    },
  ];
  const panelStyle: CSSProperties = {
    marginBottom: 14,
    background: "#fff",
    borderRadius: "12px",
    border: "none",
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="shrink-0">
            <BackButton />
          </Link>
          <h2 className="themeH1">Confirmed Events</h2>
        </div>
        <div className="flex gap-2">
          <Button>Modify</Button>
          <Button>Print</Button>
          <Button>Cancel Event</Button>
          <Button>Send Quote</Button>
          <Button>Download Invoice</Button>
          <Button>Send Invoice</Button>
          <Button>
            <MoreVertical size={14} />
          </Button>
        </div>
      </div>
      <div className="max-w-100">
        <select
          name="evnet"
          className="bg-white border border-transparent text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
        >
          <option value="">19/08/26 - Amrit - Grandstation</option>
        </select>
      </div>
      <div>
        <div className="bg-white rounded-xl p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input label="Client Name" placeholder="Enter client name" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email" type="email" placeholder="Enter email" />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter phone number"
                />
                <Input label="Dj Name" placeholder="Enter DJ name" />
                <Input
                  label="Videography"
                  placeholder="Enter videographer name"
                />
                <Input label="Caterer" placeholder="Enter caterer name" />
                <Input label="Decor" placeholder="Enter decor company" />
              </div>
              <Input label="Name" placeholder="Enter name" />
              <Input label="Entrance Song" placeholder="Enter entrance song" />
              <Input label="Cake cut song" placeholder="Enter cake cut song" />
              <Input label="First Dance" placeholder="Enter first dance song" />
              <Input label="Do's" placeholder="Enter preferences/do's" />
              <Input
                label="Stag Tune and destination"
                placeholder="Enter stag tune and destination"
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Date" type="date" placeholder="Select date" />
                <Input
                  label="Start Time"
                  type="time"
                  placeholder="Select start time"
                />
                <Input
                  label="End Time"
                  type="time"
                  placeholder="Select end time"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Access Date"
                  containerClassName="col-span-1"
                  type="date"
                  placeholder="Enter access date"
                />
                <Input
                  label="Every Day Contact Name"
                  containerClassName="col-span-2"
                  placeholder="Enter contact name"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Every Day Contact Number"
                  type="tel"
                  containerClassName="col-span-1"
                  placeholder="Enter contact number"
                />
                <Input
                  label="No of Guests"
                  type="number"
                  containerClassName="col-span-2"
                  placeholder="Enter number of guests"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Deposit Amount"
                  containerClassName="col-span-1"
                  type="number"
                  placeholder="Enter deposit amount"
                />
                <Input
                  label="Created By"
                  containerClassName="col-span-2"
                  placeholder="Enter creator name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs">
                  Brief Itinerary/Playlist and Notes
                </label>
                <textarea
                  className="h-[265px] w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                  placeholder="Enter brief itinerary, playlist, and notes"
                  style={{ resize: "none" }}
                />
              </div>
              <Input label="Don'ts" placeholder="Enter don'ts" />
              <Input
                label="Hen Tune and Destination"
                placeholder="Enter hen tune and destination"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="text-end">
        <Button type="text" showShadow={false}>
          Show Notes
        </Button>
        <Button type="text" showShadow={false}>
          Show Payments
        </Button>
      </div>
      <Collapse
        bordered={false}
        expandIconPlacement="end"
        expandIcon={({ isActive }) => (
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
          />
        )}
        style={{ background: "transparent" }}
        items={getItems(panelStyle)}
      />
    </div>
  );
};

export default page;
