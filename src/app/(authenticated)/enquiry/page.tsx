"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Input from "@/src/components/Input";
import { BackButton, CancelButton } from "@/src/components/Icons";
import { PlusIcon, Printer, Save, Send, SquareCheckBig } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const nameOptions = [
  {
    name: "Esthera Jackson",
    address: "123 Main St",
    email: "esthera@example.com",
    number: "1234567890",
  },
  {
    name: "Alexa Liras",
    address: "456 Oak Ave",
    email: "alexa@example.com",
    number: "2345678901",
  },
  {
    name: "Laurent Michael",
    address: "789 Pine Rd",
    email: "laurent@example.com",
    number: "3456789012",
  },
  {
    name: "Freduardo Hill",
    address: "321 Maple Blvd",
    email: "freduardo@example.com",
    number: "4567890123",
  },
];

const venueOptions = [
  "Grand Ballroom",
  "Rooftop Terrace",
  "Garden Pavilion",
  "Conference Hall A",
  "Banquet Room",
];

const validationSchema = Yup.object({
  name: Yup.string().max(100, "Name must be at most 100 characters").required("Name is required"),
  address: Yup.string().max(200, "Address must be at most 200 characters").required("Address is required"),
  email: Yup.string().email("Invalid email address").max(100, "Email must be at most 100 characters").required("Email is required"),
  number: Yup.string().matches(/^[0-9\s\-\+\(\)]*$/, "Invalid phone number").max(20, "Number must be at most 20 characters").required("Number is required"),
  venue: Yup.string().max(100, "Venue must be at most 100 characters").required("Venue is required"),
  eventDate: Yup.date().required("Event date is required"),
  endTime: Yup.string().required("End time is required"),
  startTime: Yup.string().required("Start time is required"),
  guestCount: Yup.number().min(1, "At least 1 guest required").required("Guest count is required"),
  dj: Yup.string().max(100, "DJ name must be at most 100 characters"),
  depositAmount: Yup.number().min(0, "Deposit cannot be negative"),
  notes: Yup.string().max(500, "Notes must be at most 500 characters"),
  tellMeMore: Yup.string().max(500, "Additional information must be at most 500 characters"),
});

const NewEnquiryPage = () => {
  const [showNameInput, setShowNameInput] = useState(false);
  const [showVenueInput, setShowVenueInput] = useState(false);

  const initialValues = {
    name: nameOptions[0].name,
    address: nameOptions[0].address,
    email: nameOptions[0].email,
    number: nameOptions[0].number,
    venue: venueOptions[0],
    eventDate: "",
    endTime: "",
    startTime: "",
    guestCount: "",
    dj: "",
    depositAmount: "",
    notes: "",
    tellMeMore: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnChange={true}
      validateOnBlur={true}
      onSubmit={(values) => {
        console.log(values);
        // Handle form submission
      }}
    >
      {({ values, errors, touched, setFieldValue, setValues }) => (
        <Form>
    <div className="mt-8 space-y-6">
      {/* Top header row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-9 space-y-6">
          <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
            <Link href="/dashboard">
              <BackButton />
            </Link>
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
                  <div className="flex gap-3 items-end">
                    {showNameInput ? (
                      <Field name="name">
                        {({ field }: any) => (
                          <Input
                            {...field}
                            label="Name"
                            placeholder="Enter name"
                            error={touched.name && errors.name}
                            required
                          />
                        )}
                      </Field>
                    ) : (
                      <div className="flex-1">
                        <label className="mb-1 block text-xs">Name</label>
                        <select
                          className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                          value={values.name}
                          onChange={(e) => {
                            const selected = e.target.value;
                            setFieldValue("name", selected);
                            const selectedObj = nameOptions.find(n => n.name === selected);
                            if (selectedObj) {
                              setValues({
                                ...values,
                                name: selected,
                                address: selectedObj.address,
                                email: selectedObj.email,
                                number: selectedObj.number,
                              });
                            }
                          }}
                        >
                          {nameOptions.map(opt => (
                            <option key={opt.name} value={opt.name}>{opt.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <Button
                      type="primary"
                      className="w-[90px]! h-10! text-xs!"
                      icon={<PlusIcon size={14} />}
                      onClick={() => {
                        setShowNameInput(v => !v);
                        if (!showNameInput) {
                          setFieldValue("name", "");
                          setFieldValue("address", "");
                          setFieldValue("email", "");
                          setFieldValue("number", "");
                        } else {
                          const firstOption = nameOptions[0];
                          setValues({
                            ...values,
                            name: firstOption.name,
                            address: firstOption.address,
                            email: firstOption.email,
                            number: firstOption.number,
                          });
                        }
                      }}
                    >
                      {showNameInput ? "Cancel" : "Add New"}
                    </Button>
                  </div>
                  <Field name="address">
                    {({ field }: any) => (
                      <Input
                        {...field}
                        label="Address"
                        placeholder="Enter address"
                        disabled={!showNameInput}
                        error={touched.address && errors.address}
                        required
                      />
                    )}
                  </Field>
                  <Field name="email">
                    {({ field }: any) => (
                      <Input
                        {...field}
                        label="Email Address"
                        type="email"
                        placeholder="Enter email"
                        disabled={!showNameInput}
                        error={touched.email && errors.email}
                        required
                      />
                    )}
                  </Field>
                  <Field name="number">
                    {({ field, form }: any) => (
                      <Input
                        {...field}
                        label="Number"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9\s\-\+\(\)]*"
                        placeholder="Enter contact number"
                        disabled={!showNameInput}
                        error={touched.number && errors.number}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow phone number characters
                          if (/^[0-9\s\-\+\(\)]*$/.test(value) || value === "") {
                            form.setFieldValue("number", value);
                          }
                        }}
                        required
                      />
                    )}
                  </Field>
                  <Field name="tellMeMore">
                    {({ field }: any) => (
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">
                          Tell me more
                        </label>
                        <textarea
                          {...field}
                          className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                          placeholder="Additional information about the enquiry"
                        />
                        {touched.tellMeMore && errors.tellMeMore && (
                          <div className="text-red-500 text-xs">{errors.tellMeMore}</div>
                        )}
                      </div>
                    )}
                  </Field>
                </div>
                <div className="space-y-4">
                  <Field name="venue">
                    {({ field }: any) => (
                      <div className="space-y-1">
                        <div className={`flex gap-2 ${showVenueInput? "items-center":"items-end"}`}>
                          {showVenueInput ? (
                            <Input
                              {...field}
                              label="Venue"
                              placeholder="Enter venue name"
                              error={touched.venue && errors.venue}
                              required
                            />
                          ) : (
                            <div className="flex-1">
                              <label className="mb-1 block text-xs">Venue</label>
                              <select
                                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                                value={field.value}
                                onChange={(e) => field.onChange(e)}
                              >
                                <option value="">Select a venue</option>
                                {venueOptions.map(venue => (
                                  <option key={venue} value={venue}>{venue}</option>
                                ))}
                              </select>
                              {touched.venue && errors.venue && (
                                <div className="text-red-500 text-xs mt-1">{errors.venue}</div>
                              )}
                            </div>
                          )}
                        <Button
                            type="primary"
                            className="h-10! w-auto! text-xs!"
                            icon={<PlusIcon size={14} />}
                            onClick={() => {
                              setShowVenueInput(v => !v);
                              if (!showVenueInput) {
                                field.onChange({ target: { name: 'venue', value: '' } });
                              } else {
                                field.onChange({ target: { name: 'venue', value: venueOptions[0] || '' } });
                              }
                            }}
                          >
                            {showVenueInput ? "Select Venue" : "Add Venue"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="eventDate">
                      {({ field }: any) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            label="Event Date"
                            type="date"
                            error={touched.eventDate && errors.eventDate}
                            required
                          />
                        </div>
                      )}
                    </Field>
                    <Field name="endTime">
                      {({ field }: any) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            label="End Time"
                            type="time"
                            error={touched.endTime && errors.endTime}
                            required
                          />
                        </div>
                      )}
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="startTime">
                      {({ field }: any) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            label="Start Time"
                            type="time"
                            error={touched.startTime && errors.startTime}
                            required
                          />
                        </div>
                      )}
                    </Field>
                    <Field name="guestCount">
                      {({ field }: any) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            label="Guest Count"
                            type="number"
                            error={touched.guestCount && errors.guestCount}
                            required
                          />
                        </div>
                      )}
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="dj">
                      {({ field }: any) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            label="Select DJ"
                            placeholder="Choose DJ"
                            error={touched.dj && errors.dj}
                          />
                        </div>
                      )}
                    </Field>
                    <Field name="depositAmount">
                      {({ field }: any) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            label="Deposit Amount"
                            type="number"
                            placeholder="0"
                            error={touched.depositAmount && errors.depositAmount}
                          />
                        </div>
                      )}
                    </Field>
                  </div>
                  <Field name="notes">
                    {({ field }: any) => (
                      <div className="space-y-1">
                        <Input
                          {...field}
                          label="Notes / Internal"
                          placeholder="Internal notes"
                          error={touched.notes && errors.notes}
                        />
                      </div>
                    )}
                  </Field>
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
        </Form>
      )}
    </Formik>
  );
};

export default NewEnquiryPage;
