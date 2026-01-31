import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Image from "next/image";

const events = [
  { date: "02/01/26", venue: "Ramside Hotel & Spa", dj: "Gurps Jandu" },
  { date: "02/01/26", venue: "The London Shenley Club", dj: "DJ Jeevan" },
  { date: "02/01/26", venue: "Ramside Hotel & Spa", dj: "DJ Nicku" },
  { date: "02/01/26", venue: "Sports Connexions", dj: "Gurps Jandu" },
  { date: "02/01/26", venue: "Ditton Manor, Langley", dj: "Rav & Huddy" },
  { date: "02/01/26", venue: "Hilton T5", dj: "Gurps Jandu" },
  { date: "02/01/26", venue: "Bedford Mercure Hotel", dj: "Arun Sandhar" },
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

const DashboardPage = () => {
  return (
    <div className="mt-8 space-y-6">
      {/* Top grid: Event Overview + right side stats */}
      <div className="grid grid-cols-12 gap-6">
        {/* Event Overview */}
        <div
          className="col-span-12 xl:col-span-6 p-0! overflow-hidden rounded-3xl bg-white"
          style={{ boxShadow: "0px 1px 3px 0px #0000001A" }}
        >
          <div className="flex items-center justify-between bg-primary p-4 text-white">
            <h4 className="font-poppins font-medium">Event Overview</h4>
            <select className="text-sm font-medium text-white">
              <option value="monthly" className="text-black">
                Monthly
              </option>
              <option value="yearly" className="text-black">
                Yearly
              </option>
            </select>
          </div>

          <div className="p-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search event"
                className="w-full rounded-lg border border-black px-4 h-7.5 text-xs bg-transparent!"
              />
            </div>
            <h3 className="text-sm">Upcoming Events</h3>
            <div className="overflow-hidden rounded-2xl border border-gray-50">
              <div className="py-3 text-xs font-medium uppercase border-b border-black/50 flex">
                <div className="w-2/12">Date</div>
                <div className="w-6/12">Venue</div>
                <div className="w-4/12">DJ Name</div>
              </div>
              <ul className="divide-y divide-gray-50 text-sm">
                {events.map((event) => (
                  <li
                    key={`${event.date}-${event.venue}-${event.dj}`}
                    className="flex items-center py-2 text-xs border-b border-black/50 hover:bg-secondary-50/60 transition-colors"
                  >
                    <div className="w-2/12">{event.date}</div>
                    <div className="w-6/12">{event.venue}</div>
                    <div className="w-4/12">{event.dj}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right column stats */}
        <section className="col-span-12 xl:col-span-6 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Events total */}
            <Card variant="white" className="col-span-1 shadow-sm p-3">
              <Image
                src={"/svgs/stat-icon.svg"}
                alt="Events"
                width={28}
                height={28}
              />
              <div className="mt-4">
                <p className="text-xs text-primary">Events</p>
                <p className="text-base font-semibold">2230</p>
              </div>
            </Card>
            {/* Remaining */}
            <Card variant="white" className="col-span-1 shadow-sm p-3">
              <Image
                src={"/svgs/list-icon.svg"}
                alt="Remaining"
                width={28}
                height={28}
              />
              <div className="mt-4">
                <p className="text-xs text-primary">Remaining</p>
                <p className="text-base font-semibold">321</p>
              </div>
            </Card>
            {/* Profit */}
            <Card
              variant="green"
              className="col-span-2 flex gap-5 items-center text-white"
            >
              <div>
                <p className="text-xs text-white/80 mb-2">Profit</p>
                <p className="text-xl font-semibold">£697,238</p>
              </div>
              <Image
                src={"/svgs/Line-chart.svg"}
                alt="line chart"
                width={74}
                height={55}
              />
            </Card>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 ">
            {/* DJ Analytics */}
            <Card variant="white" className="shadow-sm p-4 flex-1">
              <div className="mb-5">
                <p className="text-base font-medium">DJ Analytics</p>
                <p className="text-sm text-gray-100">67% Events Completed</p>
              </div>
              <div className="flex">
                <ul className="space-y-4 text-xs w-1/2">
                  <li className="">
                    <span className="flex gap-2">
                      <div className="size-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-gray-500">DJ Nikku</p>
                        <p className="text-gray-500">36%</p>
                      </div>
                    </span>
                  </li>
                  <li className="">
                    <span className="flex gap-2">
                      <div className="size-2 rounded-full bg-gray-300" />
                      <div>
                        <p className="text-gray-500">DJ Nikku</p>
                        <p className="text-gray-500">36%</p>
                      </div>
                    </span>
                  </li>
                  <li className="">
                    <span className="flex gap-2">
                      <div className="size-2 rounded-full bg-red-400" />
                      <div>
                        <p className="text-gray-500">DJ Nikku</p>
                        <p className="text-gray-500">36%</p>
                      </div>
                    </span>
                  </li>
                  <li className="">
                    <span className="flex gap-2">
                      <div className="size-2 rounded-full bg-blue-400" />
                      <div>
                        <p className="text-gray-500">DJ Nikku</p>
                        <p className="text-gray-500">36%</p>
                      </div>
                    </span>
                  </li>
                </ul>
                <div className="flex items-center justify-center w-1/2">
                  <div className="relative h-28 w-28 rounded-full bg-secondary-50 flex items-center justify-center">
                    <div className="absolute inset-1 rounded-full border-8 border-primary border-t-transparent border-l-transparent rotate-[-40deg]" />
                    <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-white">
                      <span className="text-xl font-semibold text-gray-900">
                        80%
                      </span>
                    </div>
                  </div>
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
         <Button type="primary" className="h-10! mt-auto w-full">View All Activities</Button>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
