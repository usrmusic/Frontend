import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import { BackButton, CancelButton } from "@/src/components/Icons";
import { PlusIcon, Printer, Save, Send, SquareCheckBig } from "lucide-react";
import Link from "next/link";

const NewEnquiryPage = () => {
  return (
    <div className="mt-8 space-y-6">
      {/* Top header row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-9 space-y-6">
          <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
            <>
              <Link href="/dashboard">
                <BackButton />
              </Link>
            </>
            <div className="flex flex-wrap gap-2">
              <Button type="default" icon={<Save size={14} />}>
                Save
              </Button>
              <Button type="default" icon={<Printer size={14} />}>
                Print
              </Button>
              <Button type="primary" icon={<Send size={14} />}>
                Send Quote
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-6 text-right items-center flex justify-end">
          <button className="rounded-[10px] bg-white px-4 py-1.5 text-sm font-medium text-[#2F4A52] hover:bg-emerald-700">
            <CancelButton />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left column: enquiry details + starting packages */}
        <div className="col-span-12 xl:col-span-9 space-y-6">
          {/* Enquiry details */}
          <Card variant="white" className="p-0 overflow-hidden">
            <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
              <h3 className="font-medium">Enquiry Details</h3>
              <button className="text-xs underline">+</button>
            </div>
            <div className="space-y-6 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4 pr-4 border-r border-[#CCCCCC]">
                  <div className="">
                    <label className="text-xs text-gray-500">Name</label>
                    <div className="flex gap-3">
                      <input
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                        placeholder="Enter name"
                      />
                      <Button
                        type="primary"
                        className="h-auto! w-[90px]! text-xs!"
                        icon={<PlusIcon size={14} />}
                      >
                        Add New
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Address</label>
                    <input
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                      placeholder="Enter address"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Number</label>
                    <input
                      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                      placeholder="Enter contact number"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Tell me more
                    </label>
                    <textarea
                      className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                      placeholder="Additional information about the enquiry"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Venue</label>
                    <div className="flex gap-2">
                      <input
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                        placeholder="Select venue"
                      />
                      <Button
                        type="primary"
                        className="h-auto! w-[100px]! text-xs!"
                        icon={<PlusIcon size={14} />}
                      >
                        Add Venue
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Event Date
                      </label>
                      <input
                        type="date"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">End Time</label>
                      <input
                        type="time"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Start Time
                      </label>
                      <input
                        type="time"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Select DJ</label>
                      <input
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                        placeholder="Choose DJ"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Deposit Amount
                      </label>
                      <input
                        type="number"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Notes / Internal
                      </label>
                      <input
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                        placeholder="Internal notes"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Starting Package - top table */}
          <Card variant="white" className="p-0 overflow-hidden">
            <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
              <h3 className="font-medium">Starting Package</h3>
              <p className="text-xs text-white/80">Basics</p>
            </div>
            <div className="px-6 py-5">
              <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
                <span className="w-7/12">Basics</span>
                <span className="w-1/12 text-center">Unit Price</span>
                <span className="w-1/12 text-center">Qty</span>
                <span className="w-1/12 text-center">Price</span>
                <span className="w-2/12 text-center">Notes</span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-xs"
                  >
                    <div className="flex w-7/12 items-center gap-2">
                      <input type="checkbox" className="size-4 rounded" />
                      <span>Professional DJ/Host</span>
                    </div>
                    <div className="w-1/12 text-center">0</div>
                    <div className="w-1/12 text-center">1</div>
                    <div className="w-1/12 text-center">1</div>
                    <div className="w-2/12 text-center">
                      <button className="hover:bg-white!">
                        <SquareCheckBig size={19} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Starting Package - bottom table */}
          <Card variant="white" className="p-0 overflow-hidden">
            <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
              <h3 className="font-medium">Starting Package</h3>
              <p className="text-xs text-white/80">Basics</p>
            </div>
            <div className="px-6 py-5">
              <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
                <span className="w-7/12">Basics</span>
                <span className="w-1/12 text-center">Unit Price</span>
                <span className="w-1/12 text-center">Qty</span>
                <span className="w-1/12 text-center">Price</span>
                <span className="w-2/12 text-center">Notes</span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-xs"
                  >
                    <div className="flex w-7/12 items-center gap-2">
                      <input type="checkbox" className="size-4 rounded" />
                      <span>Professional DJ/Host</span>
                    </div>
                    <div className="w-1/12 text-center">0</div>
                    <div className="w-1/12 text-center">1</div>
                    <div className="w-1/12 text-center">1</div>
                    <div className="w-2/12 text-center">
                      <button className="hover:bg-white!">
                        <SquareCheckBig size={19} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: summary + rig list */}
        <div className="col-span-12 xl:col-span-3 space-y-6">
          {/* Summary card */}
          <Card variant="white" className="p-3 overflow-hidden">
            <h3 className="text-sm font-semibold pb-4">Arun Sandhar</h3>
            <div className="pb-5 pt-1 text-xs text-gray-700 space-y-1">
              <p>• Professional DJ/Host</p>
              <p>• Digital Sound System &amp; Technician</p>
              <p>• 8 x LIGHTING: Moving Heads</p>
              <p>• SCREEN: 6m x 2m LED Screen &amp; Technician</p>
              <p>• Staging &amp; Fascia for LED Wall (Where Required)</p>
              <p>• 2x BOOTHS pre lit</p>
              <p>• Wireless Microphone</p>
              <p>• Haze Machine</p>
              <p>• Confetti Cannon</p>
              <p>• Site visit/s</p>
              <p>• Venue Documentation (10m PLI, PAT, HS, RA)</p>
            </div>
            <div className="rounded-lg bg-primary w-[124px] px-6 py-2 text-xl font-medium mx-auto text-white">
              £4,250
            </div>
          </Card>

          {/* Rig list card */}
          <Card variant="white" className="p-0 overflow-hidden">
            <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
              <h3 className="text-sm font-medium">Rig List</h3>
            </div>
            <div className="space-y-3 px-6 py-4 text-xs text-gray-700">
              <div>
                <p className="font-medium text-gray-900">
                  Professional DJ/Host
                </p>
                <p className="text-[11px] text-gray-500">
                  onetwofourtwoothwoafwohafowthewo gregregregregregreg
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Digital Sound System &amp; Technician
                </p>
                <p className="text-[11px] text-gray-500">
                  gfdgfdgfdgfdgfdgvmjhgkjbcnxvbvnmhj kjgfjhgvbvcbvjvhj Printed
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  8 x LIGHTING: Moving Heads
                </p>
                <p className="text-[11px] text-gray-500">
                  Venue Documentation (10m PLI, PAT, HS, RA)
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  SCREEN: 6m x 2m LED Screen &amp; Technician
                </p>
                <p className="text-[11px] text-gray-500">
                  kjgfjhvfbvcbvvhj Printed
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewEnquiryPage;
