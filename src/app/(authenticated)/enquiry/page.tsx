"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Input from "@/src/components/Input";
import { BackButton, CancelButton } from "@/src/components/Icons";
import { PlusIcon, Printer, Save, Send, SquareCheckBig } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { Formik, Form, Field, FormikProps } from "formik";
import * as Yup from "yup";
import {
  useClientDropdown,
  useUsersDropdown,
  useVenueDropdown,
} from "@/src/api/dropdown";
import { usePackageData, useSingleClient, useCreateEnquiry } from "@/src/api/enquiry";
import dayjs from "dayjs";

type EnquiryFormValues = {
  name: string;
  address: string;
  email: string;
  number: string;
  venue: string;
  eventDate: string;
  endTime: string;
  startTime: string;
  guestCount: string | number;
  dj: { id: string | number; name: string };
  depositAmount: string | number;
  notes: string;
  tellMeMore: string;
};

interface PackageParams {
  staff: number | null;
  package_name: string;
  event_date: string;
}

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
  name: Yup.string()
    .max(100, "Name must be at most 100 characters")
    .required("Name is required"),
  address: Yup.string()
    .max(200, "Address must be at most 200 characters")
    .required("Address is required"),
  email: Yup.string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters")
    .required("Email is required"),
  number: Yup.string()
    .matches(/^[0-9\s\-\+\(\)]*$/, "Invalid phone number")
    .max(20, "Number must be at most 20 characters")
    .required("Number is required"),
  venue: Yup.string()
    .max(100, "Venue must be at most 100 characters")
    .required("Venue is required"),
  eventDate: Yup.date().required("Event date is required"),
  endTime: Yup.string().required("End time is required"),
  startTime: Yup.string().required("Start time is required"),
  guestCount: Yup.number()
    .min(1, "At least 1 guest required")
    .required("Guest count is required"),
  dj: Yup.string().max(100, "DJ name must be at most 100 characters"),
  depositAmount: Yup.number().min(0, "Deposit cannot be negative"),
  notes: Yup.string().max(500, "Notes must be at most 500 characters"),
  tellMeMore: Yup.string().max(
    500,
    "Additional information must be at most 500 characters",
  ),
});

const NewEnquiryPage = () => {
  const [showNameInput, setShowNameInput] = useState(false);
  const [showVenueInput, setShowVenueInput] = useState(false);
  const [clientId, setClientId] = useState<null | number>(null);
  const [packageParams, setPackageParams] = useState<PackageParams>({
    event_date: "",
    staff: null,
    package_name: "",
  });
  const [selectedPackageEquipments, setSelectedPackageEquipments] =
    useState<Record<string, boolean>>({});
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>(
    {},
  );
  const { data: clientDropdownName } = useClientDropdown();
  const { data: venueDropdownName } = useVenueDropdown();
  const { data: djDropdownData } = useUsersDropdown();
  const { data: packageData } = usePackageData(packageParams);
  const { data: clientDetails } = useSingleClient(clientId ?? null);
  const createEnquiry = useCreateEnquiry();
  const formikRef = useRef<FormikProps<EnquiryFormValues>>(null);
  console.log(packageData);

  useEffect(() => {
    if (clientDetails && formikRef.current) {
      formikRef.current.setValues((prev) => ({
        ...prev,
        name: clientDetails.name ?? String(clientDetails.id),
        address: clientDetails.address ?? prev.address,
        email: clientDetails.email ?? prev.email,
        number: clientDetails.contact_number ?? prev.number,
      }));
    }
  }, [clientDetails]);

  useEffect(() => {
    // initialize selection state when package data changes
    if (packageData?.data) {
      const pkgEquip =
        packageData.data.equipments?.package_user_equipments ?? [];
      const initPkg: Record<string, boolean> = {};
      pkgEquip.forEach((it: any) => {
        const id = it.id ?? it.equipment_id ?? it.equipment?.id;
        if (id) initPkg[String(id)] = true;
      });
      setSelectedPackageEquipments(initPkg);

      const extras = packageData.data.extras ?? [];
      const initExtras: Record<string, boolean> = {};
      extras.forEach((ex: any) => {
        if (ex.id) initExtras[ex.id] = false;
      });
      setSelectedExtras(initExtras);
    }
  }, [packageData]);

  const { rigList, totalPrice } = useMemo(() => {
    const list: Array<{ name: string; notes?: string }> = [];
    let total = 0;

    const basePrice = packageData?.data?.equipments?.sell_price ?? 0;
    total += Number(basePrice) || 0;

    const pkgEquip =
      packageData?.data?.equipments?.package_user_equipments ?? [];
    pkgEquip.forEach((it: any) => {
      const equipment = it.equipment ?? null;
      const id = it.id ?? it.equipment_id ?? equipment?.id;
      const key = id != null ? String(id) : null;
      const qty = it.quantity ?? 1;
      const unit = equipment?.sell_price ?? 0;
      if (key && selectedPackageEquipments[key]) {
        total += Number(unit) * Number(qty);
        list.push({ name: equipment?.name, notes: equipment?.rig_notes });
      }
    });

    const extras = packageData?.data?.extras ?? [];
    extras.forEach((ex: any) => {
      const id = ex.id;
      const qty = ex.quantity ?? 1;
      const unit = ex.sell_price ?? 0;
      if (id && selectedExtras[id]) {
        total += Number(unit) * Number(qty);
        list.push({ name: ex.name, notes: ex.rig_notes });
      }
    });

    return { rigList: list, totalPrice: total };
  }, [packageData, selectedPackageEquipments, selectedExtras]);

  const initialValues = {
    name: "",
    address: "",
    email: "",
    number: "",
    venue: venueOptions[0],
    eventDate: "",
    endTime: "",
    startTime: "",
    guestCount: "",
    dj: { id: "", name: "" },
    depositAmount: "",
    notes: "",
    tellMeMore: "",
  };

  return (
    <Formik<EnquiryFormValues>
      innerRef={formikRef}
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
                    <Button
                      type="primary"
                      icon={<Save size={14} />}
                      onClick={async () => {
                        const eventDate = values.eventDate
                          ? dayjs(values.eventDate).format("DD-MM-YYYY")
                          : packageParams.event_date || dayjs().format("DD-MM-YYYY");

                        const djName = values.dj?.name || "";
                        const djPackageName = packageData?.data?.equipments?.package_name || packageParams.package_name || "";
                        const djCost = Number(packageData?.data?.equipments?.sell_price ?? 0);

                        const equipment_data: any[] = [];
                        const rig_notes_data: any[] = [];
                        const pkgEquip = packageData?.data?.equipments?.package_user_equipments ?? [];
                        pkgEquip.forEach((it: any) => {
                          const equipment = it.equipment ?? null;
                          const id = equipment?.id ?? it.equipment_id ?? it.id;
                          const key = id != null ? String(id) : null;
                          if (key && selectedPackageEquipments[key]) {
                            equipment_data.push({
                              equipment_id: Number(id),
                              sell_price: Number(equipment?.sell_price ?? 0),
                              quantity: Number(it.quantity ?? 1),
                              notes: equipment?.rig_notes ?? "",
                            });
                            rig_notes_data.push({ equipment_id: Number(id), rig_notes: equipment?.rig_notes ?? "" });
                          }
                        });

                        const extra_data: any[] = [];
                        const extras = packageData?.data?.extras ?? [];
                        extras.forEach((ex: any) => {
                          if (ex.id && selectedExtras[ex.id]) {
                            extra_data.push({
                              equipment_id: Number(ex.id),
                              sell_price: Number(ex.sell_price ?? 0),
                              quantity: Number(ex.quantity ?? 1),
                              notes: ex.rig_notes ?? "",
                            });
                            rig_notes_data.push({ equipment_id: Number(ex.id), rig_notes: ex.rig_notes ?? "" });
                          }
                        });

                        const clientName =
                          clientDetails?.name ||
                          clientDropdownName?.find((c) => String(c.id) === String(clientId))
                            ?.name || values.name;

                        const payload = {
                          name: clientName,
                          email: values.email,
                          contact_number: values.number,
                          address: values.address,
                          event_date: eventDate,
                          start_time: values.startTime,
                          end_time: values.endTime,
                          deposit_amount: Number(values.depositAmount) || 0,
                          new_venue_name: typeof values.venue === "string" ? values.venue : "",
                          event_details: values.tellMeMore || values.notes || "",
                          dj_name: djName,
                          dj_package_name: djPackageName,
                          total_cost: Number(totalPrice) || 0,
                          dj_cost: djCost,
                          equipment_data,
                          extra_data,
                          rig_notes_data,
                        };

                        try {
                          await createEnquiry.mutateAsync(payload);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      Save
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
                                  const selectedId = e.target.value;
                                  const selectedClient = clientDropdownName?.find(
                                    (opt) => String(opt.id) === String(selectedId),
                                  );
                                  setClientId(Number(selectedId));
                                  // set form name to the client's actual name (not the id)
                                  setFieldValue("name", selectedClient?.name ?? selectedId);
                                }}
                              >
                                <option value="">Select Name</option>
                                {clientDropdownName?.map((opt) => (
                                  <option key={opt.name} value={opt.id}>
                                    {opt.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <Button
                            type="primary"
                            className="w-[90px]! h-10! text-xs!"
                            icon={<PlusIcon size={14} />}
                            onClick={() => {
                              setShowNameInput((v) => !v);
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
                              value={values.address}
                              onChange={field.onChange}
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
                              value={values.email}
                              onChange={field.onChange}
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
                              value={values.number}
                              placeholder="Enter contact number"
                              disabled={!showNameInput}
                              error={touched.number && errors.number}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow phone number characters
                                if (
                                  /^[0-9\s\-\+\(\)]*$/.test(value) ||
                                  value === ""
                                ) {
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
                                <div className="text-red-500 text-xs">
                                  {errors.tellMeMore}
                                </div>
                              )}
                            </div>
                          )}
                        </Field>
                      </div>
                      <div className="space-y-4">
                        <Field name="venue">
                          {({ field }: any) => (
                            <div className="space-y-1">
                              <div
                                className={`flex gap-2 ${showVenueInput ? "items-center" : "items-end"}`}
                              >
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
                                    <label className="mb-1 block text-xs">
                                      Venue
                                    </label>
                                    <select
                                      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                                      value={field.value}
                                      onChange={(e) => {
                                        const selectedVenue = e.target.value;
                                        setFieldValue("venue", selectedVenue);
                                      }}
                                    >
                                      <option value="">Select a venue</option>
                                      {venueDropdownName?.map((venue) => (
                                        <option key={venue.id} value={venue.id}>
                                          {venue.venue}
                                        </option>
                                      ))}
                                    </select>
                                    {touched.venue && errors.venue && (
                                      <div className="text-red-500 text-xs mt-1">
                                        {errors.venue}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <Button
                                  type="primary"
                                  className="h-10! w-auto! text-xs!"
                                  icon={<PlusIcon size={14} />}
                                  onClick={() => {
                                    setShowVenueInput((v) => !v);
                                    if (!showVenueInput) {
                                      field.onChange({
                                        target: { name: "venue", value: "" },
                                      });
                                    } else {
                                      field.onChange({
                                        target: {
                                          name: "venue",
                                          value: venueOptions[0] || "",
                                        },
                                      });
                                    }
                                  }}
                                >
                                  {showVenueInput
                                    ? "Select Venue"
                                    : "Add Venue"}
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
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    const date = dayjs(e.target.value).format(
                                      "DD-MM-YYYY",
                                    );
                                    field.onChange(e);
                                    setPackageParams({
                                      ...packageParams,
                                      event_date: date,
                                    });
                                  }}
                                  value={field.value}
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
                                  error={
                                    touched.guestCount && errors.guestCount
                                  }
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
                                <label className="mb-1 block text-xs">
                                  Select DJ
                                </label>
                                <select
                                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                                  value={values.dj?.id}
                                  onChange={(e) => {
                                    const value = Number(e.target.value);
                                    const selectedDj = djDropdownData?.find(
                                      (item) => item.id === value,
                                    );
                                    const eventDateFormatted =
                                      packageParams.event_date ||
                                      (values.eventDate
                                        ? dayjs(values.eventDate).format(
                                            "DD-MM-YYYY",
                                          )
                                        : dayjs().format("DD-MM-YYYY"));

                                    setPackageParams({
                                      staff: selectedDj?.id ?? null,
                                      package_name:
                                        selectedDj?.package_users?.[0]
                                          ?.package_name ?? "",
                                      event_date: eventDateFormatted,
                                    });
                                    setFieldValue("dj", selectedDj);
                                  }}
                                  name={field.name}
                                >
                                  <option value="">Choose DJ</option>
                                  {djDropdownData?.map((dj) => (
                                    <option key={dj.id} value={dj.id}>
                                      {dj.name}{" "}
                                      {`(${dj.package_users?.[0]?.package_name})`}
                                    </option>
                                  ))}
                                </select>
                                {touched.dj && errors.dj && (
                                  <div className="text-red-500 text-xs mt-1">
                                    {errors.dj.name}
                                  </div>
                                )}
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
                                  error={
                                    touched.depositAmount &&
                                    errors.depositAmount
                                  }
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
                    </div>
                    <div className="space-y-2">
                      {packageData?.data?.equipments?.package_user_equipments?.map(
                        (item: any, idx: number) => {
                          const equipment = item.equipment ?? null;
                          const id = item.id ?? item.equipment_id ?? equipment?.id ?? `pkg-${idx}`;
                          const key = String(id);
                          const unitPrice = equipment?.sell_price ?? 0;
                          const qty = item.quantity ?? 1;
                          const price = unitPrice * qty;
                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between rounded-2xl bg-secondary-50/60 px-3 py-2 text-xs"
                            >
                              <div className="flex w-7/12 items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedPackageEquipments[key])}
                                  onChange={() =>
                                    setSelectedPackageEquipments((prev) => ({
                                      ...prev,
                                      [key]: !prev[key],
                                    }))
                                  }
                                  className="size-4 rounded"
                                />
                                <span>{equipment?.name}</span>
                              </div>
                              <div className="w-1/12 text-center">{unitPrice}</div>
                              <div className="w-1/12 text-center">{qty}</div>
                              <div className="w-1/12 text-center">{price}</div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </Card>

                {/* Extras - bottom table */}
                <Card variant="white" className="p-0 overflow-hidden">
                  <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                    <h3 className="font-medium">Extras</h3>
                    <p className="text-xs text-white/80">Extras</p>
                  </div>
                  <div className="px-6 py-5">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="w-7/12">Extras</span>
                      <span className="w-1/12 text-center">Unit Price</span>
                      <span className="w-1/12 text-center">Qty</span>
                      <span className="w-1/12 text-center">Price</span>
                      <span className="w-2/12 text-center">Notes</span>
                    </div>
                    <div className="space-y-2">
                      {packageData?.data?.extras?.map((extra: any) => {
                        const id = extra.id;
                        const unitPrice = extra.sell_price ?? 0;
                        const qty = extra.quantity ?? 1;
                        const price = unitPrice * qty;
                        return (
                          <div
                            key={id}
                            className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-xs"
                          >
                            <div className="flex w-7/12 items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(selectedExtras[id])}
                                onChange={() =>
                                  setSelectedExtras((prev) => ({
                                    ...prev,
                                    [id]: !prev[id],
                                  }))
                                }
                                className="size-4 rounded"
                              />
                              <span>{extra.name}</span>
                            </div>
                            <div className="w-1/12 text-center">{unitPrice}</div>
                            <div className="w-1/12 text-center">{qty}</div>
                            <div className="w-1/12 text-center">{price}</div>
                            <div className="w-2/12 text-center">
                              <button className="hover:bg-white!">
                                <SquareCheckBig size={19} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right column: summary + rig list */}
              <div className="col-span-12 xl:col-span-3 space-y-6">
                {/* Summary card */}
                <Card variant="white" className="p-3 overflow-hidden">
                  <h3 className="text-sm font-semibold pb-4">
                    {values.dj?.name || "Selected Items"}
                  </h3>
                  <div className="pb-5 pt-1 text-xs text-gray-700 space-y-1">
                    {rigList.length ? (
                      rigList.map((r, i) => (
                        <div key={i}>
                          <p className="font-medium text-gray-900">{r.name}</p>
                          {r.notes && (
                            <p className="text-[11px] text-gray-500">{r.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-gray-500">No items selected</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-primary w-[124px] px-6 py-2 text-xl font-medium mx-auto text-white">
                    {"£" + (Number(totalPrice) || 0).toLocaleString()}
                  </div>
                </Card>

                {/* Rig list card */}
                <Card variant="white" className="p-0 overflow-hidden">
                  <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                    <h3 className="text-sm font-medium">Rig List</h3>
                  </div>
                  <div className="space-y-3 px-6 py-4 text-xs text-gray-700">
                    {rigList.length ? (
                      rigList.map((r, idx) => (
                        <div key={idx}>
                          <p className="font-medium text-gray-900">{r.name}</p>
                          {r.notes && (
                            <p className="text-[11px] text-gray-500">{r.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-gray-500">No rig items selected</p>
                    )}
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
