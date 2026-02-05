"use client";
import { useState } from "react";
import Button from "@/src/components/Button";
import { BackButton, MagnifyingGlass } from "@/src/components/Icons";
import { PlusIcon, Printer, Save } from "lucide-react";
import Link from "next/link";
import Input from "@/src/components/Input";

const djBoothItems = [
  "1 x Front Board",
  "2 x Side Board",
  "1 x Front CNC",
  "2 x Side Pilades",
  "2 x Gold Strips",
];
const soundSystemItems = [
  "2 x Bass Speakers",
  "2 x Tops Speakers",
  "1 x Monitor",
  "2 x Small Speaker Poles",
  "Power Cables/Links",
];

const Page = () => {
  // Instead of booleans, store the checked items as an array of item labels (strings)
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const handleCheckboxChange = (idx: number) => {
    const item = djBoothItems[idx];
    setCheckedItems((prev) =>
      prev.includes(item)
        ? prev.filter((checkedItem) => checkedItem !== item)
        : [...prev, item],
    );
  };

  //   console.log("checked items", checkedItems);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="shrink-0">
            <BackButton />
          </Link>
          <h2 className="themeH1">Rig List</h2>
        </div>
        <div className="flex gap-3">
          <Button type="primary" icon={<Save size={14} />}>
            Save
          </Button>
          <Button icon={<Printer size={14} />}>Print</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl overflow-hidden">
          <div className="p-4 bg-primary">
            <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3">
              <MagnifyingGlass w={18} h={18} />
              <input
                type="text"
                placeholder="Search by name, mobile, or event details..."
                className="w-full bg-transparent! text-sm placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="bg-white px-5 py-4">
            <div className="text-sm space-y-4">
              <p className="mb-2">DJ BOOTH: Premium (3D Lettering and LED)</p>
              <div className="pl-4 space-y-2">
                {djBoothItems.map((label, idx) => (
                  <div className="flex items-center gap-1" key={idx}>
                    <input
                      type="checkbox"
                      id={`rig-item-${idx}`}
                      checked={checkedItems.includes(label)}
                      onChange={() => handleCheckboxChange(idx)}
                    />
                    <label htmlFor={`rig-item-${idx}`}>{label}</label>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2">Digital Sound System & Technician</p>
                <div className="pl-4 space-y-2">
                  {soundSystemItems.map((label, idx) => (
                    <div className="flex items-center gap-1" key={idx}>
                      <input
                        type="checkbox"
                        id={`rig-item-${idx}`}
                        checked={checkedItems.includes(label)}
                        onChange={() => handleCheckboxChange(idx)}
                      />
                      <label htmlFor={`rig-item-${idx}`}>{label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden">
          <div className="bg-primary h-20"></div>
          <div className="space-y-4 bg-white h-full px-4 py-3">
            <div className="space-y-1">
              <div className="flex gap-2 items-end">
                <Input label="Venue" placeholder="Select venue" />
                <Button
                  type="primary"
                  className="h-10! w-[100px]! text-xs!"
                  icon={<PlusIcon size={14} />}
                >
                  Add Venue
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input label="Event Date" type="date" />
              </div>
              <div className="space-y-1">
                <Input label="End Time" type="time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input label="Start Time" type="time" />
              </div>
              <div className="space-y-1">
                <Input label="Select DJ" placeholder="Choose DJ" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input label="Deposit Amount" type="number" placeholder="0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
