"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Image from "next/image";
import dynamic from "next/dynamic";

import { useState, useEffect } from "react";

// react-apexcharts renders only on client — use dynamic import
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
// ensure a loose-typed reference for JSX usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ApexChart: any = ReactApexChart;

const events = [
  { date: "02/01/26", venue: "Ramside Hotel & Spa", dj: "Gurps Jandu" },
  { date: "02/01/26", venue: "The London Shenley Club", dj: "DJ Jeevan" },
  { date: "02/01/26", venue: "Ramside Hotel & Spa", dj: "DJ Nicku" },
  { date: "02/01/26", venue: "Sports Connexions", dj: "Gurps Jandu" },
  { date: "02/01/26", venue: "Ditton Manor, Langley", dj: "Rav & Huddy" },
  { date: "02/01/26", venue: "Hilton T5", dj: "Gurps Jandu" },
  { date: "02/01/25", venue: "Bedford Mercure Hotel", dj: "Arun Sandhar" },
];

const enquiries = [
  {
    name: "Esthera Jackson",
    subtitle: "4th September 2025 No venue available",
    tag: "4M 19D",
  },
  {
    name: "Alexa Liras",
    subtitle: "23rd September 2025 No venue available",
    tag: "3M 24D",
  },
  {
    name: "Laurent Michael",
    subtitle: "10th October 2025 Belfry",
    tag: "2M 4D",
  },
  {
    name: "Freduardo Hill",
    subtitle: "17th October 2025 Belfry",
    tag: "1M 26D",
  },
];

const activities = [
  "Aaim created a user admin_ui",
  "Aaim deleted an admin admin_",
  "Aaim updated a user admin_ui",
  "Aaim created an event",
];

// Chart series + options for Event Overview
const chartSeries = [
  {
    name: "This month",
    data: [140, 160, 150, 180, 220, 200, 230, 250, 240, 260, 240, 270],
  },
  {
    name: "Last month",
    data: [160, 170, 165, 190, 240, 220, 210, 230, 220, 240, 230, 250],
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
const chartOptions = {
  chart: {
    id: "events-overview",
    toolbar: { show: false },
    zoom: { enabled: false },
    sparkline: { enabled: false },
  },
  colors: ["#16A34A", "#CBD5E1"],
  stroke: { curve: "smooth", width: [3, 3] },
  fill: {
    type: "gradient",
    gradient: {
      shade: "light",
      inverseColors: false,
      gradientToColors: ["#16A34A"],
      opacityFrom: 0.28,
      opacityTo: 0.02,
      stops: [0, 90, 100],
    },
  },
  grid: { borderColor: "#f1f1f1" },
  xaxis: {
    categories: Array.from({ length: 12 }, (_, i) => i + 1),
    labels: { show: true, style: { colors: "#9CA3AF", fontSize: "10px" } },
    axisTicks: { show: false },
    axisBorder: { show: false },
    crosshairs: {
      show: true,
      stroke: { color: "#D1D5DB", width: 1, dashArray: 4 },
    },
  },
  yaxis: {
    show: true,
    labels: {
      style: { colors: "#D1D5DB", fontSize: "10px" },
      formatter: (val: number) => `${val}`,
    },
  },
  markers: {
    size: 6,
    colors: ["#16A34A"],
    strokeColors: "#fff",
    strokeWidth: 3,
    hover: { size: 8 },
  },
  dataLabels: {
    enabled: true,
    enabledOnSeries: [0],
    offsetY: -10,
    style: { fontSize: "11px", colors: ["#ffffff"] },
  },
  tooltip: {
    enabled: true,
    followCursor: true,
    theme: "dark",
    custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
      const value = series[seriesIndex][dataPointIndex];
      const category =
        (w &&
          w.globals &&
          w.globals.labels &&
          w.globals.labels[dataPointIndex]) ||
        dataPointIndex + 1;
      return `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="background:#16A34A;color:white;padding:10px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.12);font-size:12px;min-width:120px;text-align:center;">
            <div style="font-weight:700;font-size:14px;line-height:1">${Number(value).toLocaleString()}</div>
            <div style="opacity:0.95;font-size:11px;margin-top:4px">${category}</div>
          </div>
          <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #16A34A;position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);"></div>
        </div>
      `;
    },
  },
} as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const DashboardPage = () => {
  const [search, setSearch] = useState("");
  const [filteredEvents, setFilteredEvents] = useState(events);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!search) {
        setFilteredEvents(events);
        return;
      }
      const lower = search.toLowerCase();
      setFilteredEvents(
        events.filter(
          (e) =>
            e.date.toLowerCase().includes(lower) ||
            e.venue.toLowerCase().includes(lower) ||
            e.dj.toLowerCase().includes(lower),
        ),
      );
    }, 250); // debounce
    return () => clearTimeout(handler);
  }, [search]);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex gap-6">
        {/* <div className="grid grid-cols-4 gap-4"> */}
        {/* Events total */}
        <Card
          variant="white"
          className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        >
          <div className="mt-4 flex-1">
            <p className="text-base text-primary">Events</p>
            <p className="text-2xl font-semibold">2230</p>
          </div>
          <Image
            src={"/svgs/stat-icon.svg"}
            alt="Events"
            width={28}
            height={28}
            className="flex-1"
          />
        </Card>
        {/* Remaining */}
        <Card variant="white" className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center">
          <Image
            src={"/svgs/list-icon.svg"}
            alt="Remaining"
            width={28}
            height={28}
            className="flex-1"

          />
          <div className="mt-4 flex-1">
            <p className="text-base text-primary">Remaining</p>
            <p className="text-2xl font-semibold">321</p>
          </div>
                    <Image
            src={"/svgs/red-chart.svg"}
            alt="Remaining"
            width={28}
            height={28}
            className="flex-1"

          />
        </Card>
        {/* open enquiry */}
        <Card variant="white" className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center">
          <Image
            src={"/svgs/Icon.svg"}
            alt="Remaining"
            width={28}
            height={28}
            className="flex-1"

          />
          <div className="mt-4 flex-1">
            <p className="text-base text-primary">Open Enquiry</p>
            <p className="text-2xl font-semibold">22550</p>
          </div>
          <Image
            src={"/svgs/red-chart.svg"}
            alt="Remaining"
            width={28}
            height={28}
            className="flex-1"
          />
        </Card>
        {/* Profit */}
        <Card
          variant="green"
          className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        >
          <div>
            <p className="text-base text-white/80 mb-2">Profit</p>
            <p className="text-2xl font-semibold text-white">£697,238</p>
          </div>
          <Image
            src={"/svgs/Line-chart.svg"}
            alt="line chart"
            width={74}
            height={55}
            className="flex-1"
          />
        </Card>
        {/* </div> */}
      </div>
      {/* Top grid: Event Overview + right side stats */}
      <div className="grid grid-cols-12 gap-6">
        {/* Event Overview */}
        <div
          className="col-span-12 xl:col-span-6 p-0! overflow-hidden rounded-3xl bg-white"
          style={{ boxShadow: "0px 1px 3px 0px #0000001A" }}
        >
          <div className="flex items-center justify-between  p-4 text-white rounded-t-3xl">
            <div className="flex items-center gap-3">
              <h4 className="font-poppins font-medium text-black">
                Event Overview
              </h4>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Active
              </span>
            </div>
            <div>
              <select className="text-sm font-medium bg-transparent text-gray-400 pr-6">
                <option value="monthly" className="text-black">
                  Monthly
                </option>
                <option value="yearly" className="text-black">
                  Yearly
                </option>
              </select>
            </div>
          </div>

          <div className="p-4">
            {/* <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search event"
                className="w-full rounded-full border border-gray-300 px-4 h-10 text-sm bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="sr-only">{filteredEvents.length} results</span>
            </div> */}
            {/* <h3 className="text-sm">Event Overview</h3> */}
            <div className="overflow-hidden rounded-2xl border border-gray-50 p-3">
              <div className="grid grid-cols-12 items-center gap-4">
                <div className="col-span-12">
                  <div className="flex flex-row gap-3">
                    <div className="rounded-xl bg-white p-4 shadow-sm flex-1">
                      <p className="text-xs text-gray-400">Total Events</p>
                      <p className="text-lg font-semibold">
                        230{" "}
                        <span className="ml-2 text-sm text-emerald-600">
                          +15.3%
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm flex-1">
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-lg font-semibold">
                        154{" "}
                        <span className="ml-2 text-sm text-emerald-600">
                          +8.2%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-12">
                  <ApexChart
                    options={chartOptions}
                    series={chartSeries}
                    type="area"
                    height={180}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column stats */}
        <section className="col-span-12 xl:col-span-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 ">
            {/* DJ Analytics */}
            <Card variant="white" className="shadow-sm p-4 flex-1">
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-800">Sales Analytics</p>
                <p className="text-xs text-gray-400">Events Progress</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-gray-900">154</span>
                  <span className="text-xs text-gray-400">/230</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">67% Events Completed</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400 block" />
                      <span className="text-gray-700">DJ Nikku</span>
                      <span className="ml-auto text-gray-500">26%</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-400 block" />
                      <span className="text-gray-700">DJ Johnson</span>
                      <span className="ml-auto text-gray-500">26%</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
                      <span className="text-gray-700">Gurps Jandu</span>
                      <span className="ml-auto text-gray-500">25%</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-24 h-24">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#EEF2E9" strokeWidth="4" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#7A9683" strokeWidth="4" strokeDasharray="60 100" strokeLinecap="round" transform="rotate(-90 18 18)" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#B6E2C6" strokeWidth="4" strokeDasharray="20 100" strokeLinecap="round" transform="rotate(-90 18 18)" />
                    <text x="18" y="22" textAnchor="middle" fontSize="8" fill="#222" fontWeight="bold">80%</text>
                  </svg>
                </div>
              </div>
            </Card>

            {/* Pending Payments */}
            <Card variant="white">
              <p className="mb-3 text-base font-medium">Pending Payment</p>
              <ul className="space-y-2 text-xs">
                {[
                  "Taj Heyre",
                  "Rabinder Babra",
                  "Naomi Robbins",
                  "Naomi Robbins",
                ].map((name, index) => (
                  <li
                    key={`${name}-${index}`}
                    className="flex items-center justify-between border-b border-black/50 py-2"
                  >
                    <div>
                      <p>{name}</p>
                      <p className="text-[11px] text-gray-400">
                        16th MAY 2021 · AVRO
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-medium text-rose-500">
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </div>

      {/* Bottom grid: Open Enquiry + Calendar + Activities */}
      <div className="grid grid-cols-12 gap-6 pb-4">
        {/* Open Enquiry */}
        <Card
          variant="white"
          className="col-span-12 lg:col-span-6 shadow-sm p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900">
              Open Enquiry (35)
            </p>
          </div>
          <ul className="text-xs">
            {enquiries.map((enq) => (
              <li
                key={enq.name}
                className="flex items-center border-b border-[#636363] last:border-0 justify-between px-3 py-3"
              >
                <div className="flex gap-3">
                  <Image
                    src={"/images/avatar.png"}
                    alt="avatar"
                    width={30}
                    height={30}
                    className="rounded-lg"
                  />
                  <div>
                    <p className="text-gray-900">{enq.name}</p>
                    <p className="text-[11px] text-gray-400">{enq.subtitle}</p>
                  </div>
                </div>
                <div className="rounded-sm bg-primary w-12 text-center py-1 text-[10px] font-medium text-white">
                  {enq.tag}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Calendar */}
        <Card
          variant="white"
          className="col-span-12 lg:col-span-3 shadow-sm p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">April 2024</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <button>{"<"}</button>
              <button>{">"}</button>
            </div>
          </div>
          <div className="mb-3 flex gap-2 text-[11px]">
            <button className="rounded-full bg-black px-3 py-1 text-white">
              Today
            </button>
            <button className="rounded-full bg-secondary-50 px-3 py-1 text-gray-600">
              This week
            </button>
            <button className="rounded-full bg-secondary-50 px-3 py-1 text-gray-600">
              This month
            </button>
            <button className="rounded-full bg-secondary-50 px-3 py-1 text-gray-600">
              Last month
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const isActive = day === 22;
              return (
                <button
                  key={day}
                  className={`h-8 w-8 rounded-full ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-secondary-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Events activity */}
        <Card
          variant="white"
          className="col-span-12 lg:col-span-3 flex flex-col"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Events (22/04/2024)
              </p>
            </div>
          </div>
          <ul className="mb-4 space-y-2 text-xs">
            {activities.map((activity) => (
              <li key={activity} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-gray-700">{activity}</span>
              </li>
            ))}
          </ul>
          <Button type="primary" className="h-10! mt-auto w-full">
            View All Activities
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
