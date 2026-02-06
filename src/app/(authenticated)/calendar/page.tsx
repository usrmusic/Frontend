"use client";
import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import { Calendar } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { MapPin, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const data = [
  {
    name: "Arun Sandhar",
    venue: "Bedford Mercure Hotel",
    address: "Bedford Mercure Hotel, Magsox Stata, Bedford, MK42 5BP, UK",
    avatar: "/images/avatar.png",
  },
  {
    name: "Jaspreet Kaur",
    venue: "London Grand Hall",
    address: "London Grand Hall, 123 Kingsway, London, WC2B 6UJ, UK",
    avatar: "/images/avatar.png",
  },
  {
    name: "Simran Dhaliwal",
    venue: "Leicester Banquet Suite",
    address: "Leicester Banquet Suite, 45 Main Street, Leicester, LE1 4AN, UK",
    avatar: "/images/avatar.png",
  },
];
const CalendarPage = () => {
  const [value, setValue] = useState(() => dayjs());
  const [selectedValue, setSelectedValue] = useState(() => dayjs("2017-01-25"));

  const onSelect = (newValue: Dayjs) => {
    setValue(newValue);
    setSelectedValue(newValue);
  };

  const onPanelChange = (newValue: Dayjs) => {
    setValue(newValue);
  };
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="shrink-0">
          <BackButton />
        </Link>
        <h2 className="themeH1">Calendar</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl overflow-hidden p-5">
          <Calendar
            value={value}
            onSelect={onSelect}
            onPanelChange={onPanelChange}
          />
        </div>
        <div className="bg-white col-span-1 rounded-xl overflow-hidden px-4 py-5">
          <div className="flex justify-between items-center">
            <p>Events Crow</p>
            <Button icon={<Plus size={14} />} type="primary">
              Add Event
            </Button>
          </div>
          <div className="mt-6">
            <p className="text-sm">Events on Monday, April 22, 2024</p>
            <div className="mt-3">
              {data.map((event, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-black/10 p-5 mb-4 last:mb-0"
                  style={{ boxShadow: "0px 4.23px 10.59px 0px #0000001A" }}
                >
                  <div className="flex gap-3">
                    <Image
                      src={event.avatar}
                      alt="avatar"
                      width={40}
                      height={40}
                      className="rounded-full size-10"
                    />
                    <div className="flex-1">
                      <p className="text-base">{event.name}</p>
                      <p className="text-sm text-[#4A5565] mt-2">
                        {event.venue}
                      </p>
                      <hr />
                    </div>
                  </div>
                  <div className="flex mt-1.5 gap-1">
                    <MapPin size={14} color="#4A5565" className="shrink-0" />
                    <span className="text-sm text-[#4A5565]">
                      {event.address}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
