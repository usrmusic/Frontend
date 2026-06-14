"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Input from "@/src/components/Input";
import { BackButton } from "@/src/components/Icons";
import { PlusIcon, Save, ChevronDown, ChevronUp, Printer, SquareCheckBig, X, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Modal, Select as AntSelect, ConfigProvider } from "antd";
import { Formik, Form, Field, FormikProps } from "formik";
import type { FieldProps } from "formik";
import * as Yup from "yup";
import {
  useClientDropdown,
  useUsersDropdown,
  useVenueDropdown,
  useEquipmentDropdown,
  useSupplierDropdown,
} from "@/src/api/dropdown";
import { useAddEquipment } from "@/src/api/usersApi";
import {
  usePackageData,
  useSingleClient,
  useCreateEnquiry,
  useGetEnquiry,
  useUpdateEnquiry,
  fetchEmailTemplate,
} from "@/src/api/enquiry";
import SendBrochureModal from "../open-enquiry/SendBrochure";
import dayjs from "dayjs";
import { parseTimeTo24 } from "@/src/utils/timeConverter";

type EnquiryFormValues = {
  name: string;
  address: string;
  email: string;
  number: string;
  venue: string;
  eventDate: string;
  endTime: string;
  startTime: string;
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
  cost_price?: number | null;
  quantity?: number | null;
  rig_notes?: string | null;
  notes?: string | null;
}

interface CustomExtra {
  tempId: string;
  equipment_id: number;
  name: string;
  sell_price: number;
  cost_price: number;
  quantity: number;
  notes: string;
  rig_notes: string;
}

type CardsOpen = {
  enquiryDetails: boolean;
  rigList: boolean;
  startingPackage: boolean;
  extras: boolean;
};

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
  dj: Yup.object()
    .shape({ id: Yup.mixed(), name: Yup.string().max(100, "DJ name must be at most 100 characters") })
    .nullable(),
  depositAmount: Yup.number().min(0, "Deposit cannot be negative"),
  notes: Yup.string().max(500, "Notes must be at most 500 characters"),
  tellMeMore: Yup.string().max(500, "Additional information must be at most 500 characters"),
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
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});
  const [restoredEditSelections, setRestoredEditSelections] = useState(false);

  // Card collapse state — enquiryDetails starts open, rigList collapsed
  const [cardsOpen, setCardsOpen] = useState<CardsOpen>({
    enquiryDetails: true,
    rigList: false,
    startingPackage: true,
    extras: true,
  });

  // Custom extras added via "Add Equipment" modal
  const [customExtras, setCustomExtras] = useState<CustomExtra[]>([]);

  // Per-equipment notes overrides (keyed by equipment id string)
  const [extrasOverrides, setExtrasOverrides] = useState<Record<string, { notes: string; rig_notes: string }>>({});

  // Editable Notes modal
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesEditValues, setNotesEditValues] = useState({ notes: "", rig_notes: "" });
  const notesOnSaveRef = useRef<((notes: string, rig_notes: string) => void) | null>(null);

  // Add Equipment modal
  const [addEquipModalOpen, setAddEquipModalOpen] = useState(false);
  const [addEquipForm, setAddEquipForm] = useState({
    has_equipment: "no" as "yes" | "no",
    equipment_id: "" as string | number,
    name: "",
    cost_price: "",
    sell_price: "",
    quantity: "1",
    supplier_id: "" as string | number,
  });

  // Send Quote modal
  const [sendQuoteOpen, setSendQuoteOpen] = useState(false);
  const [sendQuoteData, setSendQuoteData] = useState<{
    template: unknown;
    companies: unknown;
    eventId: string;
  }>({ template: null, companies: null, eventId: "" });
  const [sendQuoteLoading, setSendQuoteLoading] = useState(false);

  // Ref to capture created/edited enquiry ID for Send Quote
  const lastEnquiryIdRef = useRef<string | null>(null);

  const { data: clientDropdownName } = useClientDropdown();
  const { data: venueDropdownName } = useVenueDropdown();
  const { data: djDropdownData } = useUsersDropdown();
  const { data: packageData } = usePackageData(packageParams);
  const { data: clientDetails } = useSingleClient(!showNameInput && clientId ? clientId : null);
  const { data: equipmentDropdownData } = useEquipmentDropdown();
  const { data: supplierDropdownData } = useSupplierDropdown();

  const createEnquiry = useCreateEnquiry();
  const updateEnquiry = useUpdateEnquiry();
  const addEquipmentMutation = useAddEquipment();
  const formikRef = useRef<FormikProps<EnquiryFormValues>>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams?.get("select") ?? null;
  const queryClient = useQueryClient();
  const { data: enquiryItem } = useGetEnquiry(editId ?? undefined);

  // Keep lastEnquiryIdRef in sync with editId
  useEffect(() => {
    if (editId) lastEnquiryIdRef.current = editId;
  }, [editId]);

  useEffect(() => {
    if (!clientDetails || !formikRef.current) return;
    Promise.resolve().then(() => {
      const cur = formikRef.current?.values;
      if (!cur) return;
      const currentNameValue = !showNameInput && clientId != null ? String(clientId) : cur.name;
      const newVals = {
        ...cur,
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

  useEffect(() => {
    if (!enquiryItem || !formikRef.current) return;

    const cur = formikRef.current.values;
    const nameVal = enquiryItem.user_id
      ? String(enquiryItem.user_id)
      : enquiryItem.client_id
        ? String(enquiryItem.client_id)
        : (enquiryItem.name ?? "");
    const venueVal = enquiryItem.venue_id
      ? String(enquiryItem.venue_id)
      : (enquiryItem.new_venue_name ?? enquiryItem.venue) ?? "";
    const newVals: EnquiryFormValues = {
      name: nameVal,
      address: enquiryItem.address ?? "",
      email: enquiryItem.email ?? "",
      number: enquiryItem.contact_number ?? "",
      venue: venueVal,
      eventDate: enquiryItem.date ? dayjs(enquiryItem.date).format("YYYY-MM-DD") : (enquiryItem.event_date ?? ""),
      endTime: enquiryItem.end_time ? dayjs(enquiryItem.end_time).format("HH:mm") : (enquiryItem.end_time ?? ""),
      startTime: enquiryItem.start_time ? dayjs(enquiryItem.start_time).format("HH:mm") : (enquiryItem.start_time ?? ""),
      dj: {
        id: enquiryItem.dj_id ?? enquiryItem.dj?.id ?? "",
        name: enquiryItem.dj_name ?? enquiryItem.dj?.name ?? "",
      },
      depositAmount: (function (d) {
        if (d == null) return "";
        if (typeof d === "object") {
          if (Array.isArray((d as { d?: unknown[] }).d) && (d as { d?: unknown[] }).d!.length) return (d as { d: unknown[] }).d[0] as string | number;
          if ((d as { amount?: unknown }).amount != null) return (d as { amount: unknown }).amount as string | number;
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
        try {
          if (nameVal) formikRef.current?.setFieldValue("name", nameVal, false);
          if (venueVal) formikRef.current?.setFieldValue("venue", venueVal, false);
        } catch {}
      });
    }

    if (enquiryItem.client_id) setClientId(Number(enquiryItem.client_id));
    if (enquiryItem.user_id) setClientId(Number(enquiryItem.user_id));
    setPackageParams((prev) => ({
      ...prev,
      event_date: enquiryItem.date ? dayjs(enquiryItem.date).format("DD-MM-YYYY") : (enquiryItem.event_date ?? prev.event_date),
      package_name: enquiryItem.dj_package_name ?? prev.package_name,
      staff: enquiryItem.dj_id ?? enquiryItem.staff_id ?? prev.staff,
    }));

    try {
      const pkgMap: Record<string, boolean> = {};
      const extrasMap: Record<string, boolean> = {};
      const overridesMap: Record<string, { notes: string; rig_notes: string }> = {};
      if (Array.isArray(enquiryItem.event_packages)) {
        for (const p of enquiryItem.event_packages) {
          const eqId = p?.equipment_id ?? p?.equipment?.id ?? null;
          if (eqId != null) {
            const key = String(eqId);
            pkgMap[key] = true;
            extrasMap[key] = true;
            const savedNotes = p?.notes ?? "";
            const savedRigNotes = p?.rig_notes ?? "";
            if (savedNotes || savedRigNotes) {
              overridesMap[key] = { notes: savedNotes, rig_notes: savedRigNotes };
            }
          }
        }
      }
      Promise.resolve().then(() => {
        setSelectedPackageEquipments(pkgMap);
        setSelectedExtras(extrasMap);
        setExtrasOverrides(overridesMap);
        setRestoredEditSelections(true);
      });
    } catch {}
  }, [enquiryItem]);

  useEffect(() => {
    setRestoredEditSelections(false);
    setSelectedPackageEquipments({});
    setSelectedExtras({});
    setCustomExtras([]);
    setExtrasOverrides({});
    try { formikRef.current?.resetForm(); } catch {}
    try {
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["enquiry-item", editId], refetchType: "all" });
      }
    } catch {}
  }, [editId, queryClient]);

  useEffect(() => {
    if (packageData?.data) {
      const pkgEquip = (packageData.data.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
      const initPkg: Record<string, boolean> = {};
      for (const it of pkgEquip) {
        const id = it.equipment_id ?? it.equipment?.id ?? it.id;
        if (id != null) initPkg[String(id)] = true;
      }
      const extras = (packageData.data.extras ?? []) as ExtraItem[];
      const initExtras: Record<string, boolean> = {};
      for (const ex of extras) {
        if (ex.id != null) initExtras[String(ex.id)] = false;
      }

      Promise.resolve().then(() => {
        if (editId && restoredEditSelections) {
          setSelectedPackageEquipments((prev) => {
            const merged = { ...prev };
            for (const key of Object.keys(initPkg)) {
              if (!(key in merged)) merged[key] = false;
            }
            return merged;
          });
          setSelectedExtras((prev) => {
            const merged = { ...prev };
            for (const key of Object.keys(initExtras)) {
              if (!(key in merged)) merged[key] = false;
            }
            return merged;
          });
          return;
        }
        setSelectedPackageEquipments(initPkg);
        setSelectedExtras(initExtras);
      });
    }
  }, [packageData, editId, restoredEditSelections]);

  const { rigList, totalPrice } = useMemo(() => {
    const list: Array<{ name: string; notes?: string | null; rig_notes?: string | null }> = [];
    let total = 0;

    const basePrice = packageData?.data?.equipments?.sell_price ?? 0;
    total += Number(basePrice) || 0;

    const pkgEquip = (packageData?.data?.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
    for (const it of pkgEquip) {
      const equipment = it.equipment ?? null;
      const id = it.equipment_id ?? equipment?.id ?? it.id;
      const key = id != null ? String(id) : null;
      const qty = it.quantity ?? 1;
      const unit = equipment?.sell_price ?? 0;
      if (key && selectedPackageEquipments[key]) {
        total += Number(unit) * Number(qty);
        const override = extrasOverrides[key];
        list.push({
          name: equipment?.name ?? "",
          notes: override?.notes ?? null,
          rig_notes: override?.rig_notes ?? equipment?.rig_notes ?? null,
        });
      }
    }

    const extras = (packageData?.data?.extras ?? []) as ExtraItem[];
    for (const ex of extras) {
      const id = ex.id;
      const qty = ex.quantity ?? 1;
      const unit = ex.sell_price ?? 0;
      if (id != null && selectedExtras[String(id)]) {
        total += Number(unit) * Number(qty);
        const override = extrasOverrides[String(id)];
        list.push({
          name: ex.name ?? "",
          notes: override?.notes ?? ex.notes ?? null,
          rig_notes: override?.rig_notes ?? ex.rig_notes ?? null,
        });
      }
    }

    // Custom extras are always included
    for (const ex of customExtras) {
      total += Number(ex.sell_price) * Number(ex.quantity);
      list.push({ name: ex.name, notes: ex.notes || null, rig_notes: ex.rig_notes || null });
    }

    return { rigList: list, totalPrice: total };
  }, [packageData, selectedPackageEquipments, selectedExtras, extrasOverrides, customExtras]);

  const openNotesModal = (
    title: string,
    currentNotes: string,
    currentRigNotes: string,
    onSave: (notes: string, rig_notes: string) => void,
  ) => {
    void title;
    notesOnSaveRef.current = onSave;
    setNotesEditValues({ notes: currentNotes, rig_notes: currentRigNotes });
    setNotesModalOpen(true);
  };

  const resetAddEquipForm = () =>
    setAddEquipForm({ has_equipment: "no", equipment_id: "", name: "", cost_price: "", sell_price: "", quantity: "1", supplier_id: "" });

  const handleAddEquipmentSave = async () => {
    if (!addEquipForm.name.trim()) {
      toast.error("Equipment name is required");
      return;
    }
    let equipmentId = Number(addEquipForm.equipment_id) || 0;

    // If no existing equipment was selected, create a new one via API
    if (!equipmentId) {
      try {
        const created = await addEquipmentMutation.mutateAsync({
          name: addEquipForm.name,
          cost_price: Number(addEquipForm.cost_price) || 0,
          sell_price: Number(addEquipForm.sell_price) || 0,
          quantity: Number(addEquipForm.quantity) || 1,
          supplier_id: Number(addEquipForm.supplier_id) || undefined,
          status: "ACTIVE",
        });
        equipmentId = created?.data?.id ?? created?.id ?? 0;
      } catch {
        return;
      }
    }

    const newExtra: CustomExtra = {
      tempId: `custom-${Date.now()}`,
      equipment_id: equipmentId,
      name: addEquipForm.name,
      sell_price: Number(addEquipForm.sell_price) || 0,
      cost_price: Number(addEquipForm.cost_price) || 0,
      quantity: Number(addEquipForm.quantity) || 1,
      notes: "",
      rig_notes: "",
    };
    setCustomExtras((prev) => [...prev, newExtra]);
    setAddEquipModalOpen(false);
    resetAddEquipForm();
    toast.success("Equipment added");
  };

  const initialValues: EnquiryFormValues = {
    name: "",
    address: "",
    email: "",
    number: "",
    venue: "",
    eventDate: "",
    endTime: "",
    startTime: "",
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
          const parsedDjId =
            values.dj?.id === "" || values.dj?.id == null ? null : Number(values.dj.id);
          const djId = Number.isFinite(parsedDjId) ? parsedDjId : null;
          const djPackageName = packageData?.data?.equipments?.package_name || packageParams.package_name || "";
          const djCost = Number(packageData?.data?.equipments?.sell_price ?? 0);

          type EquipmentPayloadItem = { equipment_id: number; sell_price: number; quantity: number; notes: string };
          type RigNotesItem = { equipment_id: number; rig_notes: string };
          const equipment_data: EquipmentPayloadItem[] = [];
          const rig_notes_data: RigNotesItem[] = [];

          const pkgEquip = (packageData?.data?.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
          for (const it of pkgEquip) {
            const equipment = it.equipment ?? null;
            const id = it.equipment_id ?? equipment?.id ?? it.id;
            const key = id != null ? String(id) : null;
            if (key && selectedPackageEquipments[key]) {
              const override = extrasOverrides[key];
              equipment_data.push({
                equipment_id: Number(id),
                sell_price: Number(equipment?.sell_price ?? 0),
                quantity: Number(it.quantity ?? 1),
                notes: override?.notes ?? equipment?.rig_notes ?? "",
              });
              rig_notes_data.push({
                equipment_id: Number(id),
                rig_notes: override?.rig_notes ?? equipment?.rig_notes ?? "",
              });
            }
          }

          const extra_data: EquipmentPayloadItem[] = [];
          const extras = (packageData?.data?.extras ?? []) as ExtraItem[];
          for (const ex of extras) {
            if (ex.id != null && selectedExtras[String(ex.id)]) {
              const override = extrasOverrides[String(ex.id)];
              extra_data.push({
                equipment_id: Number(ex.id),
                sell_price: Number(ex.sell_price ?? 0),
                quantity: Number(ex.quantity ?? 1),
                notes: override?.notes ?? (ex as ExtraItem & { notes?: string }).notes ?? ex.rig_notes ?? "",
              });
              rig_notes_data.push({
                equipment_id: Number(ex.id),
                rig_notes: override?.rig_notes ?? ex.rig_notes ?? "",
              });
            }
          }

          // Include custom extras
          for (const ex of customExtras) {
            if (ex.equipment_id) {
              extra_data.push({
                equipment_id: ex.equipment_id,
                sell_price: ex.sell_price,
                quantity: ex.quantity,
                notes: ex.notes,
              });
              rig_notes_data.push({
                equipment_id: ex.equipment_id,
                rig_notes: ex.rig_notes,
              });
            }
          }

          const clientName = showNameInput
            ? values.name
            : clientDetails?.name ||
              clientDropdownName?.find((c) => String(c.id) === String(clientId))?.name ||
              values.name;

          const payload = {
            name: clientName,
            email: values.email,
            contact_number: values.number,
            address: values.address,
            event_date: eventDate,
            start_time: parseTimeTo24(values.startTime),
            end_time: parseTimeTo24(values.endTime),
            deposit_amount: Number(values.depositAmount) || 0,
            venue_id:
              values.venue && String(values.venue).match(/^\d+$/)
                ? Number(values.venue)
                : undefined,
            new_venue_name:
              values.venue && !String(values.venue).match(/^\d+$/) ? String(values.venue) : "",
            event_details: values.tellMeMore || values.notes || "",
            dj_id: djId,
            dj_name: djName,
            dj_package_name: djPackageName,
            total_cost: Number(totalPrice) || 0,
            dj_cost: djCost,
            equipment_data,
            extra_data,
            rig_notes_data,
            is_new_client: showNameInput ? true : false,
            client_id: !showNameInput && clientId ? Number(clientId) : undefined,
          };

          try {
            if (editId) {
              await updateEnquiry.mutateAsync({ id: editId, body: payload });
              toast.success("Enquiry updated");
              router.push(
                `/open-enquiry?search=${encodeURIComponent(String(editId))}&name=${encodeURIComponent(String(clientName))}`,
              );
            } else {
              const response = await createEnquiry.mutateAsync(payload);
              const newId =
                (response as { id?: unknown })?.id ??
                (response as { data?: { id?: unknown } })?.data?.id ??
                (response as { event?: { id?: unknown } })?.event?.id;
              if (newId) lastEnquiryIdRef.current = String(newId);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, setFieldValue, setValues, isSubmitting, dirty, submitForm }) => {
          let djError: string | undefined;
          if (typeof errors.dj === "string") {
            djError = errors.dj;
          } else if (errors.dj && typeof (errors.dj as { name?: unknown }).name === "string") {
            djError = (errors.dj as { name?: string }).name;
          } else {
            djError = undefined;
          }

          const handleSendQuote = async () => {
            setSendQuoteLoading(true);
            try {
              let id = lastEnquiryIdRef.current ?? editId;

              if (!id) {
                // New unsaved enquiry — save first to get an ID
                await submitForm();
                id = lastEnquiryIdRef.current;
                if (!id) {
                  toast.error("Please fix form errors and save before sending a quote");
                  return;
                }
              } else if (dirty) {
                // Has ID but unsaved changes — save first
                await submitForm();
              }

              const data = await fetchEmailTemplate(id, "SEND QUOTE-OPEN");
              setSendQuoteData({
                template: (data as { email?: unknown } | null)?.email ?? null,
                companies: (data as { companies?: unknown } | null)?.companies ?? null,
                eventId: id,
              });
              setSendQuoteOpen(true);
            } catch {
              toast.error("Failed to load email template");
            } finally {
              setSendQuoteLoading(false);
            }
          };

          return (
            <Form>
              <div className="mt-8 space-y-6">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 xl:col-span-9 space-y-6">
                    <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
                      <Link href="/dashboard">
                        <BackButton />
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="default"
                          icon={<Save size={14} />}
                          htmlType="submit"
                          loading={isSubmitting}
                          disabled={!dirty || isSubmitting}
                        >
                          {editId ? "Update" : "Save"}
                        </Button>
                        <Button
                          type="default"
                          icon={<Printer size={14} />}
                          onClick={() => window.print()}
                        >
                          Print
                        </Button>
                        <Button
                          type="primary"
                          icon={<Send size={14} />}
                          loading={sendQuoteLoading}
                          onClick={handleSendQuote}
                        >
                          Send Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* ── Left column ── */}
                  <div className="col-span-12 xl:col-span-9 space-y-6">

                    {/* Enquiry Details card — collapsible */}
                    <Card variant="white" className="p-0 overflow-hidden">
                      <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                        <h3 className="font-medium">Enquiry Details</h3>
                        <button
                          type="button"
                          className="text-white/80 hover:text-white transition-colors"
                          aria-label={cardsOpen.enquiryDetails ? "Collapse enquiry details" : "Expand enquiry details"}
                          onClick={() => setCardsOpen((s) => ({ ...s, enquiryDetails: !s.enquiryDetails }))}
                        >
                          {cardsOpen.enquiryDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      <div
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{
                          maxHeight: cardsOpen.enquiryDetails ? 2000 : 0,
                          opacity: cardsOpen.enquiryDetails ? 1 : 0,
                        }}
                        aria-hidden={!cardsOpen.enquiryDetails}
                      >
                        <div className="space-y-6 px-6 py-5">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Left sub-column */}
                            <div className="space-y-4 pr-4 border-r border-[#CCCCCC]">
                              <div className="flex gap-3 items-end">
                                {showNameInput ? (
                                  <Field name="name">
                                    {(fieldProps: FieldProps) => (
                                      <Input
                                        {...fieldProps.field}
                                        label="Name"
                                        placeholder="Enter name"
                                        className="bg-secondary-100"
                                        error={touched.name ? (errors.name as string | undefined) : undefined}
                                        required
                                      />
                                    )}
                                  </Field>
                                ) : (
                                  <div className="flex-1">
                                    <label className="mb-1 block text-xs">Name</label>
                                    <select
                                      className="h-10 w-full rounded-xl border bg-secondary-100 border-gray-200 px-3 text-sm outline-none"
                                      value={clientId != null ? String(clientId) : String(values.name ?? "")}
                                      onChange={(e) => {
                                        const selectedId = e.target.value;
                                        setClientId(selectedId ? Number(selectedId) : null);
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
                                  className="w-[150px]! h-10! text-xs!"
                                  icon={<PlusIcon size={14} />}
                                  onClick={() => {
                                    setShowNameInput((v) => !v);
                                    if (!showNameInput) {
                                      setClientId(null);
                                      setFieldValue("name", "");
                                      setFieldValue("address", "");
                                      setFieldValue("email", "");
                                      setFieldValue("number", "");
                                    } else {
                                      const firstOption = clientDropdownName?.[0];
                                      const id = firstOption ? Number(firstOption.id) : null;
                                      setValues({ ...values, name: id ? String(id) : values.name, address: values.address, email: values.email, number: values.number });
                                      if (id) setClientId(id);
                                    }
                                  }}
                                >
                                  {showNameInput ? "Select Client" : "Add new"}
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
                                    className="bg-secondary-100"
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
                                    className="bg-secondary-100"
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
                                      className="bg-secondary-100"
                                      disabled={!showNameInput}
                                      error={touched.number ? (errors.number as string | undefined) : undefined}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const value = e.target.value;
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
                                      className="min-h-[72px] w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 py-2 text-sm outline-none"
                                      placeholder="Additional information about the enquiry"
                                    />
                                    {touched.tellMeMore && errors.tellMeMore && (
                                      <div className="text-red-500 text-xs">{errors.tellMeMore}</div>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Right sub-column */}
                            <div className="space-y-4">
                              <Field name="venue">
                                {(fieldProps: FieldProps) => (
                                  <div className="space-y-1">
                                    <div className="flex gap-2 items-end">
                                      {showVenueInput ? (
                                        <Input
                                          {...fieldProps.field}
                                          label="Venue"
                                          placeholder="Enter venue name"
                                          className="bg-secondary-100"
                                          error={touched.venue ? (errors.venue as string | undefined) : undefined}
                                          required
                                        />
                                      ) : (
                                        <div className="flex-1">
                                          <label className="mb-1 block text-xs">Venue</label>
                                          <select
                                            className="h-10 w-full rounded-xl border bg-secondary-100 border-gray-200 px-3 text-sm outline-none"
                                            value={String(fieldProps.field.value ?? "")}
                                            onChange={(e) => setFieldValue("venue", String(e.target.value))}
                                          >
                                            <option value="">Select a venue</option>
                                            {venueDropdownName?.map((venue) => (
                                              <option key={venue.id} value={String(venue.id)}>
                                                {venue.venue}
                                              </option>
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
                                          setShowVenueInput((v) => !v);
                                          if (!showVenueInput) {
                                            setFieldValue("venue", "");
                                          } else {
                                            setFieldValue(
                                              "venue",
                                              venueDropdownName?.[0]?.id != null
                                                ? String(venueDropdownName[0].id)
                                                : "",
                                            );
                                          }
                                        }}
                                      >
                                        {showVenueInput ? "Select Venue" : "Add venue"}
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
                                        className="bg-secondary-100"
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
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <Field name="startTime">
                                  {(fieldProps: FieldProps) => (
                                    <div className="space-y-1">
                                      <Input
                                        {...fieldProps.field}
                                        label="Start Time"
                                        type="text"
                                        className="bg-secondary-100"
                                        placeholder="e.g. 7am, 7:30pm or 07:00"
                                        error={touched.startTime ? (errors.startTime as string | undefined) : undefined}
                                        required
                                        value={fieldProps.field.value}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("startTime", e.target.value)}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => setFieldValue("startTime", parseTimeTo24(e.target.value))}
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
                                        type="text"
                                        className="bg-secondary-100"
                                        placeholder="e.g. 7am, 7:30pm or 19:30"
                                        error={touched.endTime ? (errors.endTime as string | undefined) : undefined}
                                        required
                                        value={fieldProps.field.value}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("endTime", e.target.value)}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => setFieldValue("endTime", parseTimeTo24(e.target.value))}
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
                                        className="h-10 w-full rounded-xl border bg-secondary-100 border-gray-200 px-3 text-sm outline-none"
                                        value={values.dj?.id}
                                        onChange={(e) => {
                                          const value = Number(e.target.value);
                                          const selectedDj = djDropdownData?.find((item) => item.id === value);
                                          const eventDateFormatted =
                                            packageParams.event_date ||
                                            (values.eventDate
                                              ? dayjs(values.eventDate).format("DD-MM-YYYY")
                                              : dayjs().format("DD-MM-YYYY"));
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
                                        className="bg-secondary-100"
                                        placeholder="0"
                                        error={touched.depositAmount ? (errors.depositAmount as string | undefined) : undefined}
                                      />
                                    </div>
                                  )}
                                </Field>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Starting Package */}
                    <Card variant="white" className="p-0 overflow-hidden border border-primary/30">
                      <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                        <h3 className="font-medium">Starting Package</h3>
                        <button
                          type="button"
                          className="text-white/80 hover:text-white transition-colors"
                          aria-label={cardsOpen.startingPackage ? "Collapse" : "Expand"}
                          onClick={() => setCardsOpen((s) => ({ ...s, startingPackage: !s.startingPackage }))}
                        >
                          {cardsOpen.startingPackage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      <div
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{
                          maxHeight: cardsOpen.startingPackage ? 2000 : 0,
                          paddingTop: cardsOpen.startingPackage ? 20 : 0,
                          paddingBottom: cardsOpen.startingPackage ? 20 : 0,
                          opacity: cardsOpen.startingPackage ? 1 : 0,
                        }}
                        aria-hidden={!cardsOpen.startingPackage}
                      >
                        <div className="px-6 text-xs text-gray-700">
                          <div className="mb-2 flex items-center text-[11px] text-gray-500">
                            <span className="w-6/12">Basics</span>
                            <span className="w-2/12 text-center">Unit Price</span>
                            <span className="w-1/12 text-center">Qty</span>
                            <span className="w-1/12 text-center">Price</span>
                            <span className="w-2/12 text-center">Notes</span>
                          </div>
                          <div className="space-y-2">
                            {packageData?.data?.equipments?.package_user_equipments?.map(
                              (item: PackageUserEquipment, idx: number) => {
                                const equipment = item.equipment ?? null;
                                const id = item.equipment_id ?? equipment?.id ?? item.id ?? `pkg-${idx}`;
                                const key = String(id);
                                const unitPrice = equipment?.sell_price ?? 0;
                                const qty = item.quantity ?? 1;
                                const price = unitPrice * qty;
                                const override = extrasOverrides[key];
                                return (
                                  <div
                                    key={key}
                                    className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-xs"
                                  >
                                    <div className="flex w-6/12 items-center gap-2">
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
                                    <div className="w-2/12 text-center">{unitPrice}</div>
                                    <div className="w-1/12 text-center">{qty}</div>
                                    <div className="w-1/12 text-center">{price}</div>
                                    <div className="w-2/12 flex justify-center">
                                      <button
                                        type="button"
                                        title="Add / edit notes"
                                        onClick={() =>
                                          openNotesModal(
                                            equipment?.name ?? "Notes",
                                            override?.notes ?? "",
                                            override?.rig_notes ?? equipment?.rig_notes ?? "",
                                            (notes, rig_notes) =>
                                              setExtrasOverrides((prev) => ({
                                                ...prev,
                                                [key]: { notes, rig_notes },
                                              })),
                                          )
                                        }
                                      >
                                        <SquareCheckBig
                                          size={19}
                                          className={override ? "text-primary" : "text-gray-400"}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Extras */}
                    <Card variant="white" className="p-0 overflow-hidden border border-primary/30">
                      <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
                        <h3 className="font-medium">Extras</h3>
                        <button
                          type="button"
                          className="text-white/80 hover:text-white transition-colors"
                          aria-label={cardsOpen.extras ? "Collapse" : "Expand"}
                          onClick={() => setCardsOpen((s) => ({ ...s, extras: !s.extras }))}
                        >
                          {cardsOpen.extras ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      <div
                        className="transition-all duration-300 ease-in-out overflow-hidden no-scrollbar"
                        style={{
                          maxHeight: cardsOpen.extras ? 2000 : 0,
                          paddingTop: cardsOpen.extras ? 20 : 0,
                          paddingBottom: cardsOpen.extras ? 20 : 0,
                          opacity: cardsOpen.extras ? 1 : 0,
                        }}
                        aria-hidden={!cardsOpen.extras}
                      >
                        <div className="px-6 text-xs text-gray-700">
                          <div className="mb-2 flex items-center text-[11px] text-gray-500">
                            <span className="w-6/12">Extras</span>
                            <span className="w-2/12 text-center">Unit Price</span>
                            <span className="w-1/12 text-center">Qty</span>
                            <span className="w-1/12 text-center">Price</span>
                            <span className="w-2/12 text-center">Notes</span>
                          </div>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                            {/* Package extras */}
                            {packageData?.data?.extras?.map((extra: ExtraItem) => {
                              const id = extra.id;
                              const key = String(id ?? "");
                              const unitPrice = extra.sell_price ?? 0;
                              const qty = extra.quantity ?? 1;
                              const price = unitPrice * qty;
                              const override = extrasOverrides[key];
                              return (
                                <div
                                  key={id}
                                  className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-xs"
                                >
                                  <div className="flex w-6/12 items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(selectedExtras[key])}
                                      onChange={() =>
                                        setSelectedExtras((prev) => ({
                                          ...prev,
                                          [key]: !prev[key],
                                        }))
                                      }
                                      className="size-4 rounded"
                                    />
                                    <span>{extra.name}</span>
                                  </div>
                                  <div className="w-2/12 text-center">{unitPrice}</div>
                                  <div className="w-1/12 text-center">{qty}</div>
                                  <div className="w-1/12 text-center">{price}</div>
                                  <div className="w-2/12 flex justify-center">
                                    <button
                                      type="button"
                                      title="Add / edit notes"
                                      aria-label={`Notes for ${extra.name}`}
                                      onClick={() =>
                                        openNotesModal(
                                          extra.name ?? "Notes",
                                          override?.notes ?? (extra as ExtraItem & { notes?: string }).notes ?? "",
                                          override?.rig_notes ?? extra.rig_notes ?? "",
                                          (notes, rig_notes) =>
                                            setExtrasOverrides((prev) => ({
                                              ...prev,
                                              [key]: { notes, rig_notes },
                                            })),
                                        )
                                      }
                                    >
                                      <SquareCheckBig
                                        size={19}
                                        className={override ? "text-primary" : "text-gray-400"}
                                      />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Custom extras (always selected) */}
                            {customExtras.map((ex) => {
                              const price = ex.sell_price * ex.quantity;
                              return (
                                <div
                                  key={ex.tempId}
                                  className="flex items-center rounded-2xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs"
                                >
                                  <div className="flex w-6/12 items-center gap-2">
                                    <input type="checkbox" checked readOnly className="size-4 rounded" />
                                    <span className="font-medium text-gray-800">{ex.name}</span>
                                  </div>
                                  <div className="w-2/12 text-center">{ex.sell_price}</div>
                                  <div className="w-1/12 text-center">{ex.quantity}</div>
                                  <div className="w-1/12 text-center">{price}</div>
                                  <div className="w-2/12 flex justify-center gap-2">
                                    <button
                                      type="button"
                                      title="Edit notes"
                                      onClick={() =>
                                        openNotesModal(
                                          ex.name,
                                          ex.notes,
                                          ex.rig_notes,
                                          (notes, rig_notes) =>
                                            setCustomExtras((prev) =>
                                              prev.map((c) =>
                                                c.tempId === ex.tempId ? { ...c, notes, rig_notes } : c,
                                              ),
                                            ),
                                        )
                                      }
                                    >
                                      <SquareCheckBig
                                        size={19}
                                        className={ex.notes || ex.rig_notes ? "text-primary" : "text-gray-400"}
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      title="Remove"
                                      onClick={() =>
                                        setCustomExtras((prev) =>
                                          prev.filter((c) => c.tempId !== ex.tempId),
                                        )
                                      }
                                      className="text-red-400 hover:text-red-600 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Add New Equipment — primary button below Extras card */}
                    <div>
                      <Button
                        type="primary"
                        onClick={() => setAddEquipModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <PlusIcon size={15} />
                        Add New Equipment
                      </Button>
                    </div>
                  </div>

                  {/* ── Right column ── */}
                  <div className="col-span-12 xl:col-span-3 space-y-6">
                    {/* At a Glance */}
                    <Card variant="white" className="p-0 overflow-hidden">
                      <div className="flex items-center justify-between bg-white px-6 py-4 text-black/80">
                        <h3 className="font-medium">{values.dj?.name || "At a Glance"}</h3>
                      </div>
                      <div className="px-5 py-4 text-xs text-gray-700 space-y-2">
                        {rigList.length ? (
                          rigList.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <SquareCheckBig size={15} className="flex-shrink-0 text-primary" />
                              <p className="text-xs text-gray-800 leading-tight">{r.name}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-gray-500 py-2">No items selected</p>
                        )}
                        <div className="mt-3 flex justify-center pt-1">
                          <div className="rounded-xl bg-primary px-6 py-2 text-xl font-semibold text-white text-center min-w-[110px]">
                            {"£" + (Number(totalPrice) || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Rig list card */}
                    <Card variant="white" className="p-0 overflow-hidden">
                      <div className="flex items-center justify-between bg-white px-6 py-4 text-black/80">
                        <h3 className="font-medium">Rig List</h3>
                        <button
                          type="button"
                          className="text-black/80 hover:text-black/80 transition-colors"
                          aria-label={cardsOpen.rigList ? "Collapse rig list" : "Expand rig list"}
                          onClick={() => setCardsOpen((s) => ({ ...s, rigList: !s.rigList }))}
                        >
                          {cardsOpen.rigList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      <div
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{
                          maxHeight: cardsOpen.rigList ? 600 : 0,
                          paddingTop: cardsOpen.rigList ? 20 : 0,
                          paddingBottom: cardsOpen.rigList ? 20 : 0,
                          opacity: cardsOpen.rigList ? 1 : 0,
                        }}
                        aria-hidden={!cardsOpen.rigList}
                      >
                        <div className="px-6 text-xs text-gray-700">
                          <div className="space-y-3">
                            {rigList.length ? (
                              rigList.map((r, idx) => (
                                <div key={idx} className="space-y-0.5">
                                  <div className="flex items-start gap-2">
                                    <SquareCheckBig size={14} className="flex-shrink-0 text-primary mt-0.5" />
                                    <p className="font-medium text-gray-900 leading-tight">{r.name}</p>
                                  </div>
                                  {(r.notes || r.rig_notes) && (
                                    <div className="pl-6 space-y-0.5">
                                      {r.notes && (
                                        <p className="text-[11px] text-gray-500 leading-snug break-words whitespace-pre-line">{r.notes}</p>
                                      )}
                                      {r.rig_notes && (
                                        <p className="text-[11px] text-gray-500 leading-snug break-words whitespace-pre-line">{r.rig_notes}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-gray-500">No rig items selected</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>

      <ConfigProvider theme={{ components: { Modal: { paddingMD: 0, paddingContentHorizontalLG: 0 } }, token: { borderRadiusLG: 16 } }}>

      {/* Notes Modal — editable */}
      <Modal
        open={notesModalOpen}
        onCancel={() => setNotesModalOpen(false)}
        footer={null}
        closable={false}
        rootClassName="green-header-modal"
        title={
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold">Add Notes</span>
            <button onClick={() => setNotesModalOpen(false)} className="text-white opacity-80 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        }
        styles={{
          header: { background: "#719984", padding: "16px 24px", borderRadius: "16px 16px 0 0" },
          body: { padding: "20px 24px" },
        }}
        centered
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Notes</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 bg-secondary-100 px-3 py-2 text-sm outline-none resize-none focus:border-primary transition-colors"
              rows={4}
              value={notesEditValues.notes}
              onChange={(e) => setNotesEditValues((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter notes..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Rig Notes</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 bg-secondary-100 px-3 py-2 text-sm outline-none resize-none focus:border-primary transition-colors"
              rows={4}
              value={notesEditValues.rig_notes}
              onChange={(e) => setNotesEditValues((prev) => ({ ...prev, rig_notes: e.target.value }))}
              placeholder="Enter rig notes..."
            />
          </div>
          <div className="flex justify-center pt-1">
            <Button
              type="primary"
              className="min-w-[120px]!"
              onClick={() => {
                notesOnSaveRef.current?.(notesEditValues.notes, notesEditValues.rig_notes);
                setNotesModalOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Equipment Modal */}
      <Modal
        open={addEquipModalOpen}
        onCancel={() => { setAddEquipModalOpen(false); resetAddEquipForm(); }}
        footer={null}
        closable={false}
        rootClassName="green-header-modal"
        title={
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold">Add Equipment</span>
            <button onClick={() => { setAddEquipModalOpen(false); resetAddEquipForm(); }} className="text-white opacity-80 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        }
        styles={{
          header: { background: "#719984", padding: "16px 24px", borderRadius: "16px 16px 0 0" },
          body: { padding: "20px 24px" },
        }}
        centered
      >
        <div className="space-y-4">
          {/* Do you have the equipment? */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Do you have the equipment?</label>
            <select
              className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
              value={addEquipForm.has_equipment}
              onChange={(e) => {
                const val = e.target.value as "yes" | "no";
                setAddEquipForm((prev) => ({
                  ...prev,
                  has_equipment: val,
                  equipment_id: "",
                  name: "",
                  cost_price: "",
                  sell_price: "",
                  supplier_id: "",
                }));
              }}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          {/* If Yes — pick from existing equipment */}
          {addEquipForm.has_equipment === "yes" && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Select Equipment</label>
              <AntSelect
                className="w-full"
                placeholder="Select equipment"
                allowClear
                showSearch
                optionFilterProp="label"
                options={(equipmentDropdownData ?? []).map((eq: { id: number | string; name: string }) => ({
                  label: eq.name,
                  value: String(eq.id),
                }))}
                value={addEquipForm.equipment_id ? String(addEquipForm.equipment_id) : undefined}
                onChange={(val) => {
                  if (!val) {
                    setAddEquipForm((prev) => ({ ...prev, equipment_id: "", name: "", cost_price: "", sell_price: "", supplier_id: "" }));
                    return;
                  }
                  const eq = (equipmentDropdownData ?? []).find(
                    (e: { id: number | string }) => String(e.id) === val,
                  ) as { id: number | string; name: string; sell_price?: number; cost_price?: number; supplier_id?: number | string } | undefined;
                  setAddEquipForm((prev) => ({
                    ...prev,
                    equipment_id: val,
                    name: eq?.name ?? "",
                    cost_price: String(eq?.cost_price ?? ""),
                    sell_price: String(eq?.sell_price ?? ""),
                    supplier_id: String(eq?.supplier_id ?? ""),
                  }));
                }}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Equipment Name *</label>
            <input
              className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
              placeholder="Equipment name"
              value={addEquipForm.name}
              onChange={(e) => setAddEquipForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Cost Price *</label>
            <input
              type="number"
              className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0"
              value={addEquipForm.cost_price}
              onChange={(e) => setAddEquipForm((prev) => ({ ...prev, cost_price: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Sell Price *</label>
            <input
              type="number"
              className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0"
              value={addEquipForm.sell_price}
              onChange={(e) => setAddEquipForm((prev) => ({ ...prev, sell_price: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Supplier Company Name *</label>
            <AntSelect
              className="w-full"
              placeholder="Select Suppliers"
              allowClear
              showSearch
              optionFilterProp="label"
              options={(supplierDropdownData ?? []).map((s: { id: number | string; name?: string; company_name?: string }) => ({
                label: s.company_name ?? s.name ?? "",
                value: String(s.id),
              }))}
              value={addEquipForm.supplier_id ? String(addEquipForm.supplier_id) : undefined}
              onChange={(val) => setAddEquipForm((prev) => ({ ...prev, supplier_id: val ?? "" }))}
            />
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              className="min-w-[90px]!"
              onClick={() => { setAddEquipModalOpen(false); resetAddEquipForm(); }}
            >
              Close
            </Button>
            <Button type="primary" className="min-w-[90px]!" onClick={handleAddEquipmentSave}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      </ConfigProvider>

      {/* Send Quote modal */}
      {sendQuoteOpen && (
        <SendBrochureModal
          open={sendQuoteOpen}
          sendMode="quote"
          eventId={sendQuoteData.eventId}
          template={
            sendQuoteData.template as {
              id?: string;
              email_name?: string;
              subject?: string;
              body?: string;
            } | null
          }
          companies={sendQuoteData.companies as Array<{ id: string | number; name: string }> | null}
          onCancel={() => {
            setSendQuoteOpen(false);
            setSendQuoteData({ template: null, companies: null, eventId: "" });
          }}
        />
      )}
    </>
  );
};

export default NewEnquiryPage;
