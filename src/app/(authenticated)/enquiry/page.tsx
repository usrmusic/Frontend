"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Input from "@/src/components/Input";
import { BackButton } from "@/src/components/Icons";
import { PlusIcon, Save, SquareCheckBig } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Modal } from "antd";
import { Formik, Form, Field, FormikProps } from "formik";
import type { FieldProps } from "formik";
import * as Yup from "yup";
import {
  useClientDropdown,
  useUsersDropdown,
  useVenueDropdown,
} from "@/src/api/dropdown";
import { usePackageData, useSingleClient, useCreateEnquiry, useGetEnquiry, useUpdateEnquiry } from "@/src/api/enquiry";
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

interface EquipmentItem {
  id?: number | string | null;
  name?: string | null;
  sell_price?: number | null;
  rig_notes?: string | null;
}

interface PackageUserEquipment {
  id?: number | string | null;
  equipment_id?: number | string | null;
  quantity?: number | null;
  equipment?: EquipmentItem | null;
}

interface ExtraItem {
  id?: number | string | null;
  name?: string | null;
  sell_price?: number | null;
  quantity?: number | null;
  rig_notes?: string | null;
}


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
  dj: Yup.object()
    .shape({ id: Yup.mixed(), name: Yup.string().max(100, "DJ name must be at most 100 characters") })
    .nullable(),
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
  const { data: clientDetails } = useSingleClient(!showNameInput && clientId ? clientId : null);
  const createEnquiry = useCreateEnquiry();
  const updateEnquiry = useUpdateEnquiry();
  const formikRef = useRef<FormikProps<EnquiryFormValues>>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesItem, setNotesItem] = useState<ExtraItem | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams?.get("select") ?? null;
  // debug: log editId to ensure query is enabled
  console.debug("NewEnquiryPage editId:", editId);
  const { data: enquiryItem } = useGetEnquiry(editId ?? undefined);

  useEffect(() => {
    if (!clientDetails || !formikRef.current) return;
    // Schedule update to avoid synchronous setState inside an effect
    Promise.resolve().then(() => {
      const cur = formikRef.current?.values;
      if (!cur) return;
      const currentNameValue = !showNameInput && clientId != null ? String(clientId) : cur.name;
      const newVals = {
        ...cur,
        // Keep `name` as selected client id in dropdown mode.
        name: currentNameValue,
        address: clientDetails.address ?? cur.address,
        email: clientDetails.email ?? cur.email,
        number: clientDetails.contact_number ?? cur.number,
      };
      if (
        cur.name !== newVals.name ||
        cur.address !== newVals.address ||
        cur.email !== newVals.email ||
        cur.number !== newVals.number
      ) {
        formikRef.current?.setValues(newVals);
      }
    });
  }, [clientDetails, showNameInput, clientId]);

  // When editing an existing enquiry, populate the form with fetched data
  useEffect(() => {
    console.debug("NewEnquiryPage enquiryItem changed:", enquiryItem);
    if (!enquiryItem || !formikRef.current) return;

    const cur = formikRef.current.values;
    const nameVal = enquiryItem.user_id ? String(enquiryItem.user_id) : enquiryItem.client_id ? String(enquiryItem.client_id) : (enquiryItem.name ?? "");
    const venueVal = enquiryItem.venue_id ? String(enquiryItem.venue_id) : (enquiryItem.new_venue_name ?? enquiryItem.venue) ?? "";
    const newVals: EnquiryFormValues = {
      name: nameVal,
      address: enquiryItem.address ?? "",
      email: enquiryItem.email ?? "",
      number: enquiryItem.contact_number ?? enquiryItem.contact_number ?? "",
      venue: venueVal,
      // input[type=date] expects YYYY-MM-DD
      eventDate: enquiryItem.date ? dayjs(enquiryItem.date).format("YYYY-MM-DD") : (enquiryItem.event_date ?? ""),
      // input[type=time] expects HH:mm
      endTime: enquiryItem.end_time ? dayjs(enquiryItem.end_time).format("HH:mm") : (enquiryItem.end_time ?? ""),
      startTime: enquiryItem.start_time ? dayjs(enquiryItem.start_time).format("HH:mm") : (enquiryItem.start_time ?? ""),
      guestCount: enquiryItem.guestCount ?? enquiryItem.guest_count ?? "",
      dj: {
        id: enquiryItem.dj_id ?? enquiryItem.dj?.id ?? "",
        name: enquiryItem.dj_name ?? enquiryItem.dj?.name ?? "",
      },
      depositAmount: (function (d) {
        if (d == null) return "";
        if (typeof d === "object") {
          if (Array.isArray(d.d) && d.d.length) return d.d[0];
          if (typeof d === "object" && d.amount != null) return d.amount;
          return "";
        }
        return d;
      })(enquiryItem.deposit_amount),
      notes: enquiryItem.notes ?? enquiryItem.details ?? "",
      tellMeMore: enquiryItem.event_details ?? enquiryItem.details ?? "",
    };

    if (JSON.stringify(cur) !== JSON.stringify(newVals)) {
      Promise.resolve().then(() => {
        formikRef.current?.setValues(newVals);
        // ensure selects pick up the id-based values
        try {
          if (nameVal) formikRef.current?.setFieldValue("name", nameVal, false);
          if (venueVal) formikRef.current?.setFieldValue("venue", venueVal, false);
        } catch {}
      });
    }

    // also set client id and package params where available
    if (enquiryItem.client_id) setClientId(Number(enquiryItem.client_id));
    if (enquiryItem.user_id) setClientId(Number(enquiryItem.user_id));
    setPackageParams((prev) => ({
      ...prev,
      event_date: enquiryItem.date ? dayjs(enquiryItem.date).format("DD-MM-YYYY") : (enquiryItem.event_date ?? prev.event_date),
      package_name: enquiryItem.dj_package_name ?? prev.package_name,
      staff: enquiryItem.dj_id ?? enquiryItem.staff_id ?? prev.staff,
    }));

    // initialize selected package equipments from event_packages if present
    try {
      const pkgMap: Record<string, boolean> = {};
      const extrasMap: Record<string, boolean> = {};
      if (Array.isArray(enquiryItem.event_packages)) {
        for (const p of enquiryItem.event_packages) {
          const eqId = p?.equipment?.id ?? p?.equipment_id ?? null;
          if (eqId != null) pkgMap[String(eqId)] = true;
        }
      }
      // set selected state only if we found something
      if (Object.keys(pkgMap).length) Promise.resolve().then(() => setSelectedPackageEquipments(pkgMap));
      if (Object.keys(extrasMap).length) Promise.resolve().then(() => setSelectedExtras(extrasMap));
    } catch {}
  }, [enquiryItem]);

  useEffect(() => {
    // initialize selection state when package data changes
    if (packageData?.data) {
      const pkgEquip = (packageData.data.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
      const initPkg: Record<string, boolean> = {};
      for (const it of pkgEquip) {
        const id = it.id ?? it.equipment_id ?? it.equipment?.id;
        if (id != null) initPkg[String(id)] = true;
      }
      const extras = (packageData.data.extras ?? []) as ExtraItem[];
      const initExtras: Record<string, boolean> = {};
      for (const ex of extras) {
        if (ex.id != null) initExtras[String(ex.id)] = false;
      }

      // Defer state updates to avoid synchronous setState in the effect
      Promise.resolve().then(() => {
        setSelectedPackageEquipments(initPkg);
        setSelectedExtras(initExtras);
      });
    }
  }, [packageData]);

  const { rigList, totalPrice } = useMemo(() => {
    const list: Array<{ name: string; notes?: string | null }> = [];
    let total = 0;

    const basePrice = packageData?.data?.equipments?.sell_price ?? 0;
    total += Number(basePrice) || 0;

    const pkgEquip = (packageData?.data?.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
    for (const it of pkgEquip) {
      const equipment = it.equipment ?? null;
      const id = it.id ?? it.equipment_id ?? equipment?.id;
      const key = id != null ? String(id) : null;
      const qty = it.quantity ?? 1;
      const unit = equipment?.sell_price ?? 0;
      if (key && selectedPackageEquipments[key]) {
        total += Number(unit) * Number(qty);
        list.push({ name: equipment?.name ?? "", notes: equipment?.rig_notes ?? null });
      }
    }

    const extras = (packageData?.data?.extras ?? []) as ExtraItem[];
    for (const ex of extras) {
      const id = ex.id;
      const qty = ex.quantity ?? 1;
      const unit = ex.sell_price ?? 0;
      if (id != null && selectedExtras[String(id)]) {
        total += Number(unit) * Number(qty);
        list.push({ name: ex.name ?? "", notes: ex.rig_notes ?? null });
      }
    }

    return { rigList: list, totalPrice: total };
  }, [packageData, selectedPackageEquipments, selectedExtras]);

  const initialValues: EnquiryFormValues = {
    name: "",
    address: "",
    email: "",
    number: "",
    venue: "",
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
    <>
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnChange={true}
        validateOnBlur={true}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true);
          const eventDate = values.eventDate
            ? dayjs(values.eventDate).format("DD-MM-YYYY")
            : packageParams.event_date || dayjs().format("DD-MM-YYYY");

          const djName = values.dj?.name || "";
          const djPackageName = packageData?.data?.equipments?.package_name || packageParams.package_name || "";
          const djCost = Number(packageData?.data?.equipments?.sell_price ?? 0);

          type EquipmentPayloadItem = { equipment_id: number; sell_price: number; quantity: number; notes: string };
          type RigNotesItem = { equipment_id: number; rig_notes: string };
          const equipment_data: EquipmentPayloadItem[] = [];
          const rig_notes_data: RigNotesItem[] = [];
          const pkgEquip = (packageData?.data?.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
          for (const it of pkgEquip) {
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
          }

          const extra_data: EquipmentPayloadItem[] = [];
          const extras = (packageData?.data?.extras ?? []) as ExtraItem[];
          for (const ex of extras) {
            if (ex.id != null && selectedExtras[String(ex.id)]) {
              extra_data.push({
                equipment_id: Number(ex.id),
                sell_price: Number(ex.sell_price ?? 0),
                quantity: Number(ex.quantity ?? 1),
                notes: ex.rig_notes ?? "",
              });
              rig_notes_data.push({ equipment_id: Number(ex.id), rig_notes: ex.rig_notes ?? "" });
            }
          }

          const clientName = showNameInput
            ? values.name
            : clientDetails?.name ||
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
            venue_id: values.venue && String(values.venue).match(/^\d+$/) ? Number(values.venue) : undefined,
            new_venue_name: values.venue && !String(values.venue).match(/^\d+$/) ? String(values.venue) : "",
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
            if (editId) {
              await updateEnquiry.mutateAsync({ id: editId, body: payload });
              toast.success("Enquiry updated");
              // stay on page or navigate back
              router.push(`/open-enquiry?search=${encodeURIComponent(String(editId))}&name=${encodeURIComponent(String(clientName))}`);
            } else {
              await createEnquiry.mutateAsync(payload);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setSubmitting(false);
          }
        }}
    >
      {({ values, errors, touched, setFieldValue, setValues, isSubmitting }) => {
        let djError: string | undefined;
        if (typeof errors.dj === "string") {
          djError = errors.dj;
        } else if (
          errors.dj &&
          typeof (errors.dj as { name?: unknown }).name === "string"
        ) {
          djError = (errors.dj as { name?: string }).name;
        } else {
          djError = undefined;
        }

        return (
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
                    <Button type="primary" icon={<Save size={14} />} htmlType="submit" loading={isSubmitting}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Left column: enquiry details + starting packages */}
              <div className="col-span-12 xl:col-span-9 space-y-6">
                {/* Enquiry details */}
                <Card variant="white" className="p-0 overflow-hidden">
                  <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                    <h3 className="font-medium">Enquiry Details</h3>
                    <button type="button" className="text-xs underline">+</button>
                  </div>
                  <div className="space-y-6 px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-4 pr-4 border-r border-[#CCCCCC]">
                        <div className="flex gap-3 items-end">
                          {showNameInput ? (
                            <Field name="name">
                              {(fieldProps: FieldProps) => (
                                <Input
                                  {...fieldProps.field}
                                  label="Name"
                                  placeholder="Enter name"
                                  error={touched.name ? (errors.name as string | undefined) : undefined}
                                  required
                                />
                              )}
                            </Field>
                          ) : (
                            <div className="flex-1">
                              <label className="mb-1 block text-xs">Name</label>
                              <select
                                className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                                value={clientId != null ? String(clientId) : String(values.name ?? "")}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  setClientId(selectedId ? Number(selectedId) : null);
                                  // Store selected client id so the dropdown can stay selected reliably.
                                  setFieldValue("name", String(selectedId));
                                }}
                              >
                                <option value="">Select Name</option>
                                {clientDropdownName?.map((opt) => (
                                  <option key={opt.id} value={String(opt.id)}>
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
                                // entering Add New: clear selected client id and fields
                                setClientId(null);
                                setFieldValue("name", "");
                                setFieldValue("address", "");
                                setFieldValue("email", "");
                                setFieldValue("number", "");
                              } else {
                                // leaving Add New: restore first dropdown option (id) if available
                                const firstOption = clientDropdownName?.[0];
                                const id = firstOption ? Number(firstOption.id) : null;
                                setValues({
                                  ...values,
                                  name: id ? String(id) : values.name,
                                  address: values.address,
                                  email: values.email,
                                  number: values.number,
                                });
                                if (id) setClientId(id);
                              }
                            }}
                          >
                            {showNameInput ? "Cancel" : "Add New"}
                          </Button>
                        </div>
                        <Field name="address">
                          {(fieldProps: FieldProps) => (
                            <Input
                              {...fieldProps.field}
                              label="Address"
                              value={values.address}
                              onChange={fieldProps.field.onChange}
                              placeholder="Enter address"
                              disabled={!showNameInput}
                              error={touched.address ? (errors.address as string | undefined) : undefined}
                              required
                            />
                          )}
                        </Field>
                        <Field name="email">
                          {(fieldProps: FieldProps) => (
                            <Input
                              {...fieldProps.field}
                              label="Email Address"
                              type="email"
                              placeholder="Enter email"
                              disabled={!showNameInput}
                              error={touched.email ? (errors.email as string | undefined) : undefined}
                              required
                              value={values.email}
                              onChange={fieldProps.field.onChange}
                            />
                          )}
                        </Field>
                        <Field name="number">
                          {(fieldProps: FieldProps) => {
                            const { field, form } = fieldProps;
                            return (
                              <Input
                                {...field}
                                label="Number"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9\s\-\+\(\)]*"
                                value={values.number}
                                placeholder="Enter contact number"
                                disabled={!showNameInput}
                                error={touched.number ? (errors.number as string | undefined) : undefined}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const value = e.target.value;
                                  // Only allow phone number characters
                                  if (/^[0-9\s\-\+\(\)]*$/.test(value) || value === "") {
                                    form.setFieldValue("number", value);
                                  }
                                }}
                                required
                              />
                            );
                          }}
                        </Field>
                        <Field name="tellMeMore">
                          {(fieldProps: FieldProps) => (
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500">Tell me more</label>
                              <textarea
                                {...fieldProps.field}
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
                          {(fieldProps: FieldProps) => (
                            <div className="space-y-1">
                              <div
                                className={`flex gap-2 ${showVenueInput ? "items-center" : "items-end"}`}
                              >
                                {showVenueInput ? (
                                    <Input
                                    {...fieldProps.field}
                                    label="Venue"
                                    placeholder="Enter venue name"
                                    error={touched.venue ? (errors.venue as string | undefined) : undefined}
                                    required
                                  />
                                ) : (
                                  <div className="flex-1">
                                    <label className="mb-1 block text-xs">
                                      Venue
                                    </label>
                                    <select
                                      className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                                      value={String(fieldProps.field.value ?? "")}
                                      onChange={(e) => {
                                        const selectedVenue = e.target.value;
                                        setFieldValue("venue", String(selectedVenue));
                                      }}
                                    >
                                      <option value="">Select a venue</option>
                                      {venueDropdownName?.map((venue) => (
                                        <option key={venue.id} value={String(venue.id)}>
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
                                      setFieldValue("venue", "");
                                    } else {
                                      setFieldValue("venue", venueDropdownName?.[0]?.id != null ? String(venueDropdownName[0].id) : "");
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
                            {(fieldProps: FieldProps) => (
                              <div className="space-y-1">
                                <Input
                                  {...fieldProps.field}
                                  label="Event Date"
                                  type="date"
                                  error={touched.eventDate ? (errors.eventDate as string | undefined) : undefined}
                                  required
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const date = dayjs(e.target.value).format("DD-MM-YYYY");
                                    fieldProps.field.onChange(e);
                                    setPackageParams((prev) => ({ ...prev, event_date: date }));
                                  }}
                                  value={fieldProps.field.value}
                                />
                              </div>
                            )}
                          </Field>
                          <Field name="endTime">
                            {(fieldProps: FieldProps) => (
                              <div className="space-y-1">
                                <Input
                                  {...fieldProps.field}
                                  label="End Time"
                                  type="time"
                                  error={touched.endTime ? (errors.endTime as string | undefined) : undefined}
                                  required
                                />
                              </div>
                            )}
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Field name="startTime">
                            {(fieldProps: FieldProps) => (
                              <div className="space-y-1">
                                <Input
                                  {...fieldProps.field}
                                  label="Start Time"
                                  type="time"
                                  error={touched.startTime ? (errors.startTime as string | undefined) : undefined}
                                  required
                                />
                              </div>
                            )}
                          </Field>
                          <Field name="guestCount">
                            {(fieldProps: FieldProps) => (
                              <div className="space-y-1">
                                <Input
                                  {...fieldProps.field}
                                  label="Guest Count"
                                  type="number"
                                  error={touched.guestCount ? (errors.guestCount as string | undefined) : undefined}
                                  required
                                />
                              </div>
                            )}
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field name="dj">
                              {(fieldProps: FieldProps) => (
                                <div className="space-y-1">
                                  <label className="mb-1 block text-xs">Select DJ</label>
                                  <select
                                    className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none"
                                    value={values.dj?.id}
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      const selectedDj = djDropdownData?.find((item) => item.id === value);
                                      const eventDateFormatted =
                                        packageParams.event_date ||
                                        (values.eventDate ? dayjs(values.eventDate).format("DD-MM-YYYY") : dayjs().format("DD-MM-YYYY"));

                                      setPackageParams((prev) => ({
                                        ...prev,
                                        staff: selectedDj?.id ?? null,
                                        package_name: selectedDj?.package_users?.[0]?.package_name ?? "",
                                        event_date: eventDateFormatted,
                                      }));
                                      setFieldValue("dj", selectedDj);
                                    }}
                                    name={fieldProps.field.name}
                                  >
                                    <option value="">Choose DJ</option>
                                    {djDropdownData?.map((dj) => (
                                      <option key={dj.id} value={dj.id}>
                                        {dj.name} {`(${dj.package_users?.[0]?.package_name})`}
                                      </option>
                                    ))}
                                  </select>
                                  {touched.dj && !!djError && (
                                    <div className="text-red-500 text-xs mt-1">{djError}</div>
                                  )}
                                </div>
                              )}
                            </Field>
                          <Field name="depositAmount">
                            {(fieldProps: FieldProps) => (
                              <div className="space-y-1">
                                <Input
                                  {...fieldProps.field}
                                  label="Deposit Amount"
                                  type="number"
                                  placeholder="0"
                                  error={touched.depositAmount ? (errors.depositAmount as string | undefined) : undefined}
                                />
                              </div>
                            )}
                          </Field>
                        </div>
                        <Field name="notes">
                          {(fieldProps: FieldProps) => (
                            <div className="space-y-1">
                              <Input
                                {...fieldProps.field}
                                label="Notes / Internal"
                                placeholder="Internal notes"
                                error={touched.notes ? (errors.notes as string | undefined) : undefined}
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
                        (item: PackageUserEquipment, idx: number) => {
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
                      {packageData?.data?.extras?.map((extra: ExtraItem) => {
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
                                checked={Boolean(selectedExtras[String(id)])}
                                onChange={() =>
                                  setSelectedExtras((prev) => ({
                                    ...prev,
                                    [String(id)]: !prev[String(id)],
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
                              <button
                                type="button"
                                className="hover:bg-white!"
                                onClick={() => {
                                  setNotesItem(extra);
                                  setNotesModalOpen(true);
                                }}
                                aria-label={`Open notes for ${extra.name}`}
                              >
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
                <Card variant="white" className="p-0 overflow-hidden">
                  <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                    <h3 className="font-medium">{values.dj?.name || "Selected Items"}</h3>
                  </div>
                  <div className="px-6 py-5 text-xs text-gray-700 space-y-1">
                    {rigList.length ? (
                      rigList.map((r, i) => (
                        <div key={i}>
                          <p className="font-medium text-gray-900">{r.name}</p>
                          {/* {r.notes && (
                            <p className="text-[11px] text-gray-500">{r.notes}</p>
                          )} */}
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-gray-500">No items selected</p>
                    )}
                    <div className="mt-4 flex justify-center">
                      <div className="rounded-lg bg-primary w-[124px] px-6 py-2 text-xl font-medium text-white">
                        {"£" + (Number(totalPrice) || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Rig list card */}
                <Card variant="white" className="p-0 overflow-hidden">
                  <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                    <h3 className="font-medium">Rig List</h3>
                  </div>
                  <div className="px-6 py-5 text-xs text-gray-700 space-y-3">
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
      );
    }}
    </Formik>
    <Modal
      open={notesModalOpen}
      onCancel={() => setNotesModalOpen(false)}
      footer={
        <div className="flex justify-end">
          <Button onClick={() => setNotesModalOpen(false)}>Close</Button>
        </div>
      }
      title={notesItem?.name ?? "Notes"}
    >
      <p className="whitespace-pre-wrap text-sm text-gray-700">{notesItem?.rig_notes ?? "No notes available"}</p>
    </Modal>
    </>
  );
};

export default NewEnquiryPage;
