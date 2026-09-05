"use client";
import Button from "@/src/components/Button";
import Card from "@/src/components/Card";
import Input from "@/src/components/Input";
import { BackButton } from "@/src/components/Icons";
import { PlusIcon, Save, ChevronDown, ChevronUp, Printer, SquareCheckBig, X, Send, MoreVertical, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Modal, Select as AntSelect, ConfigProvider, DatePicker, Spin } from "antd";
import { Formik, Form, Field, FormikProps } from "formik";
import type { FieldProps } from "formik";
import * as Yup from "yup";
import {
  useClientDropdown,
  useUsersDropdown,
  useVenueDropdown,
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
  checkEquipmentAvailability,
} from "@/src/api/enquiry";
import SendBrochureModal from "../open-enquiry/SendBrochure";
import useRole from "@/src/hooks/useRole";
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
  eventType: string;
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
  cost_price?: number | null;
  rig_notes?: string | null;
  // Total stock owned, and whether the overbooking check applies to this
  // item at all — matches Laravel's equipment.quantity / is_availabilty_check.
  quantity?: number | null;
  is_availabilty_check?: boolean | null;
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
  is_availabilty_check?: boolean | null;
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
  selected?: boolean;
}

type CardsOpen = {
  enquiryDetails: boolean;
  rigList: boolean;
  startingPackage: boolean;
  extras: boolean;
};

const EVENT_TYPES = ["Wedding Reception", "Destination Wedding", "Corporate", "Jago/Sangeet", "Other"];

const validationSchema = Yup.object({
  name: Yup.string()
    .max(100, "Name must be at most 100 characters")
    .required("Name is required"),
  address: Yup.string()
    .max(200, "Address must be at most 200 characters"),
  email: Yup.string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters")
    .required("Email is required"),
  number: Yup.string()
    .matches(/^[0-9\s\-\+\(\)]*$/, "Invalid phone number")
    .max(20, "Number must be at most 20 characters")
    .required("Number is required"),
  // Not required — staff may not know the venue yet at enquiry stage
  // (matches Laravel, which never requires venue on this form either).
  venue: Yup.string().max(100, "Venue must be at most 100 characters"),
  eventDate: Yup.date().required("Event date is required"),
  endTime: Yup.string(),
  startTime: Yup.string(),
  dj: Yup.object()
    .shape({ id: Yup.mixed(), name: Yup.string().max(100, "DJ name must be at most 100 characters") })
    .nullable(),
  eventType: Yup.string(),
  depositAmount: Yup.number().min(0, "Deposit cannot be negative"),
  notes: Yup.string().max(500, "Notes must be at most 500 characters"),
  tellMeMore: Yup.string().max(500, "Additional information must be at most 500 characters"),
});

// Next.js App Router does not remount a page component when only the query
// string changes on the same route — navigating from `/enquiry?select=1476`
// (editing) to plain `/enquiry` (sidebar "Enquiry" link, i.e. "new enquiry")
// keeps every useState/useRef in NewEnquiryPageInner alive with the previous
// event's data, even though the extensive editId-driven reset effects below
// try to clear it. Rather than extend that already-fragile reset chain
// further, force a clean remount whenever the edit target changes by keying
// the inner component on it — React then re-runs every hook from scratch.
const NewEnquiryPage = () => {
  const searchParams = useSearchParams();
  const editId = searchParams?.get("select") ?? null;
  return <NewEnquiryPageInner key={editId || "new"} />;
};

const NewEnquiryPageInner = () => {
  const [showNameInput, setShowNameInput] = useState(false);
  const [showVenueInput, setShowVenueInput] = useState(false);
  // Summary sidebar defaults to open once a DJ is picked (item 8); the 3-dot
  // button lets the user hide/show it without losing the selection.
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(true);
  const [clientId, setClientId] = useState<null | number>(null);
  const [packageParams, setPackageParams] = useState<PackageParams>({
    event_date: "",
    staff: null,
    package_name: "",
  });
  const [selectedPackageEquipments, setSelectedPackageEquipments] =
    useState<Record<string, boolean>>({});
  // Basics (Starting Package) items are bundled into the DJ package's base
  // price up to their default `quantity` (from package_user_equipments), but
  // — matching Laravel's editable Qty spinner — staff can bump a row's
  // quantity higher, in which case only the excess over the bundled default
  // is billed (see calculatePriceAddedToBill in the legacy app). Keyed by
  // equipment id, same as selectedPackageEquipments; a missing key means
  // "use the bundled default quantity".
  const [packageEquipmentQty, setPackageEquipmentQty] =
    useState<Record<string, number>>({});
  // Unit-price override for Basics items — matches Laravel's dblclick-to-edit
  // price field (new_enquiry.js `.create-sell-price`/`.new-sell-price`).
  // Missing key means "use the equipment's catalog sell_price".
  const [packageEquipmentPrice, setPackageEquipmentPrice] =
    useState<Record<string, number>>({});
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});
  // Unit-price and quantity overrides for the DJ-package's predefined Extras
  // list — same parity requirement as Basics above (Laravel allows editing
  // both fields via the same dblclick pattern for Extras rows).
  const [extrasPrice, setExtrasPrice] = useState<Record<string, number>>({});
  const [extrasQty, setExtrasQty] = useState<Record<string, number>>({});
  const [restoredEditSelections, setRestoredEditSelections] = useState(false);

  // Advisory-only overbooking warning — parity with Laravel, which fires this
  // on checkbox-check and quantity-change but never blocks the save either
  // way. Only bothers calling the API when the item actually has the
  // availability check enabled, same gating Laravel applies client-side.
  const runOverbookCheck = (
    eventDateIso: string,
    equipmentId: number | string | null | undefined,
    quantity: number,
    isAvailabilityCheck: boolean | null | undefined,
  ) => {
    if (!isAvailabilityCheck || equipmentId == null) return;
    // No event date yet is NOT a reason to skip: the backend still runs the
    // absolute "more than we own" check without one, which is exactly what
    // Laravel does. Bailing here meant asking for 27 of a 1-in-stock item
    // showed no warning at all until a date was picked.
    checkEquipmentAvailability({
      date: eventDateIso ? dayjs(eventDateIso).format("YYYY-MM-DD") : "",
      items: [{ equipment_id: equipmentId, quantity }],
    }).then((messages) => {
      messages.forEach((m) => toast.warning(m));
    });
  };
  // Flips true the moment the user picks a DJ from the dropdown themselves
  // (as opposed to packageParams.staff being set by the edit-hydration effect
  // from the saved enquiry). See the packageData effect below for why this
  // distinction matters for whether a newly-loaded package defaults to
  // checked or preserves whatever was already ticked.
  const djManuallyChangedRef = useRef(false);

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

  // Add Equipment modal — field order/types mirror the legacy system:
  // name → cost → sell → "Do you have this Equipment?" → (Yes ? quantity : supplier)
  const [addEquipModalOpen, setAddEquipModalOpen] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [addEquipForm, setAddEquipForm] = useState({
    has_equipment: "no" as "yes" | "no",
    name: "",
    cost_price: "",
    sell_price: "",
    quantity: "",
    supplier_id: "" as string | number,
    supplier_name: "",
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

  // Summary sidebar height is now pure CSS — see the `aside` near the bottom of
  // this file. The previous approach measured `window.innerHeight - rect.top`
  // in a `useLayoutEffect` and it was wrong in three separate ways:
  //
  //   1. No dependency array, so it re-ran after *every* render.
  //   2. `rect.top` means two different things for the same element depending on
  //      whether `position: sticky` has engaged — its in-flow offset before, the
  //      pinned offset after. The cap therefore changed as you scrolled.
  //   3. It measured against `window`, but the real scrollport is the
  //      `overflow-y-auto` box in LayoutClient, not the viewport.
  //
  // Mounting the panel while already scrolled down (which is exactly what
  // happens — it only appears once a DJ is picked, by which point you have
  // scrolled) produced a large `rect.top` and collapsed the cap to its 240px
  // floor. That truncated the panel and cut off the Rig List row at its bottom:
  // client-reported "awkward top gap and hiding text (e.g. the word Rig List)".

  // Printing. Two sheets share one mechanism:
  //   "enquiry" — the page header's Print button: the whole enquiry form as it
  //               currently stands (filled or blank) plus equipment and rig notes.
  //   "rig"     — the summary panel's Print button: rig list and notes only.
  //
  // The markup is portalled to <body> (see the `#print-section` block in
  // globals.css) so it escapes the app shell's nested `overflow-y-auto` +
  // `rounded-3xl` containers — printing it in place clipped it to the scrollport
  // and dropped everything below the fold.
  const [printMode, setPrintMode] = useState<"enquiry" | "rig" | null>(null);

  // The print is fired from an effect rather than straight out of the click
  // handler because the sheet's content depends on `printMode`: window.print()
  // snapshots the DOM synchronously, so calling it in the handler would capture
  // the markup from *before* the mode was applied — i.e. the previous sheet, or
  // nothing at all on the first press.
  useEffect(() => {
    if (!printMode) return;
    const body = document.body;
    body.classList.add("print-scoped");
    const cleanup = () => {
      body.classList.remove("print-scoped");
      window.removeEventListener("afterprint", cleanup);
      setPrintMode(null);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    return () => {
      body.classList.remove("print-scoped");
      window.removeEventListener("afterprint", cleanup);
    };
  }, [printMode]);

  const { data: clientDropdownName } = useClientDropdown();
  const { data: venueDropdownName } = useVenueDropdown();
  const { data: djDropdownData } = useUsersDropdown();
  const { data: packageData, isLoading: isPackageLoading } = usePackageData(packageParams);
  const { data: clientDetails } = useSingleClient(!showNameInput && clientId ? clientId : null);
  const { data: supplierDropdownData } = useSupplierDropdown();

  // Re-run the overbooking check across every currently-ticked row at once.
  // Laravel does this on the date picker's onSelect (and on DJ change), not
  // just per-row: availability is date-specific, so rows that were fine for
  // the old date can clash on the new one. Sent as a single batched request
  // rather than one call per row.
  const runOverbookCheckAll = (eventDateIso: string) => {
    const items: { equipment_id: number; quantity: number }[] = [];

    const pkgEquip = (packageData?.data?.equipments?.package_user_equipments ??
      []) as PackageUserEquipment[];
    for (const it of pkgEquip) {
      const equipment = it.equipment ?? null;
      const id = it.equipment_id ?? equipment?.id ?? it.id;
      const key = id != null ? String(id) : null;
      if (!key || !selectedPackageEquipments[key]) continue;
      if (!equipment?.is_availabilty_check || equipment?.id == null) continue;
      const basicQty = Number(it.quantity ?? 1);
      items.push({
        equipment_id: Number(equipment.id),
        quantity: Number(packageEquipmentQty[key] ?? basicQty),
      });
    }

    const extras = (packageData?.data?.extras ?? []) as ExtraItem[];
    for (const ex of extras) {
      const key = ex.id != null ? String(ex.id) : "";
      if (!key || !selectedExtras[key]) continue;
      if (!ex.is_availabilty_check || ex.id == null) continue;
      items.push({
        equipment_id: Number(ex.id),
        quantity: Number(extrasQty[key] ?? 1),
      });
    }

    if (!items.length) return;
    checkEquipmentAvailability({
      date: eventDateIso ? dayjs(eventDateIso).format("YYYY-MM-DD") : "",
      items,
    }).then((messages) => {
      messages.forEach((m) => toast.warning(m));
    });
  };

  const createEnquiry = useCreateEnquiry();
  const updateEnquiry = useUpdateEnquiry();
  const addEquipmentMutation = useAddEquipment();
  const formikRef = useRef<FormikProps<EnquiryFormValues>>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams?.get("select") ?? null;
  const queryClient = useQueryClient();
  const { data: enquiryItem } = useGetEnquiry(editId ?? undefined);
  const { isAdmin, userId } = useRole();

  // /user/get-dropdown excludes soft-deleted users, so an enquiry whose
  // assigned DJ has since left/been deactivated has a dj_id that matches NO
  // option in djDropdownData — Ant Select then renders blank even though
  // values.dj.id is correctly populated, since it looks up the display label
  // from the options list rather than from the stored value alone. Splicing
  // in a synthetic entry from the enquiry's own DJ relation (now included by
  // GET /enquiry/:id) guarantees the Select always has a matching option for
  // whichever DJ this specific enquiry is actually assigned to.
  const djOptionsData = useMemo(() => {
    // Staff only ever books their own package — the full DJ roster is an
    // Admin-only concern (assigning enquiries to whichever DJ is free).
    const full = djDropdownData ?? [];
    const base = isAdmin ? full : full.filter((u) => u.id === userId);
    const editedDj = enquiryItem?.users_events_dj_idTousers;
    if (editedDj?.id != null && !base.some((u) => u.id === editedDj.id)) {
      return [...base, editedDj];
    }
    return base;
  }, [djDropdownData, enquiryItem, isAdmin, userId]);

  // Keep lastEnquiryIdRef in sync with editId
  useEffect(() => {
    if (editId) lastEnquiryIdRef.current = editId;
  }, [editId]);

  useEffect(() => {
    if (!clientDetails || !formikRef.current) return;
    Promise.resolve().then(() => {
      /* setFieldValue PER FIELD — deliberately NOT setValues, not even with a
         functional updater.

         This was the actual "edit form populates the first time, then comes
         back blank" bug. Formik's setValues resolves a functional updater
         OUTSIDE the reducer, against `state.values` from the last COMMITTED
         render (it's captured in a useEventCallback ref that's only refreshed
         in a layout effect), and the reducer then does a wholesale replace:
         `values: msg.payload`. So `setValues(prev => ...)` hands you exactly
         the same stale snapshot as reading formikRef.current.values would —
         taking `prev` from Formik buys nothing here.

         That matters because this effect and the enquiryItem-hydration effect
         below both defer their writes with Promise.resolve().then(). On a warm
         React Query cache both microtasks drain before React re-renders, so
         BOTH resolve against the same pre-hydration (blank) snapshot. The
         hydration effect dispatches the full enquiry, then this one dispatches
         {...blank, name, address, email, number} and wholesale-replaces it —
         leaving precisely the four fields this effect owns populated and DJ /
         venue / event date / times / deposit / details blank.

         setFieldValue is immune: its reducer case composes against LIVE state
         (`setIn(state.values, field, value)`), so these four fields can never
         clobber a sibling field, in any interleaving. */
      const setField = formikRef.current?.setFieldValue;
      if (!setField) return;
      // shouldValidate=false: these are programmatic hydration writes, not user
      // edits, so they shouldn't surface validation errors on an untouched form.
      if (!showNameInput && clientId != null) {
        setField("name", String(clientId), false);
      }
      if (clientDetails.address != null) setField("address", clientDetails.address, false);
      if (clientDetails.email != null) setField("email", clientDetails.email, false);
      if (clientDetails.contact_number != null) {
        setField("number", clientDetails.contact_number, false);
      }
    });
  }, [clientDetails, showNameInput, clientId]);

  /* Reset-or-hydrate for the current editId — deliberately ONE effect, not two.

     This used to be split into this effect (hydrate from enquiryItem) and a
     separate effect that called formikRef.current.resetForm() whenever editId
     changed. That was the actual bug: resetForm() ran SYNCHRONOUSLY inside its
     own effect, while this effect's setValues() is deferred via
     Promise.resolve().then(). React runs every effect for a commit in
     definition order before yielding, so when enquiryItem is already warm in
     the React Query cache (e.g. navigating here from Open Enquiry) both
     effects fire in the SAME commit — and the synchronous resetForm() in the
     later effect always executed after this effect had merely SCHEDULED its
     update, wiping it out every time. On a hard refresh there's no warm cache,
     so enquiryItem arrives in a later commit than the reset — different
     commits, no race, works "by accident". That's exactly the reported
     "works on refresh, not on click-through" split.

     Fix: only one effect ever touches the form for a given editId, and it
     decides reset-vs-hydrate itself by checking whether the fetched
     enquiryItem actually corresponds to the currently-requested editId (its
     `id` can lag behind editId for one render after navigating to a
     different enquiry, since react-query keeps serving the previous cached
     value until the new fetch resolves). */
  const hydratedForIdRef = useRef<string | null>(null);
  // Separate from hydratedForIdRef: that ref guards the RESET branch (don't
  // reset twice for the same target). This one guards the whole-form setValues
  // DISPATCH in the hydrate branch, so a background refetch of an enquiry the
  // user is already editing can't wholesale-replace their in-progress typing.
  const formValuesHydratedForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!formikRef.current) return;

    const matchesCurrentTarget =
      editId != null && enquiryItem != null && String(enquiryItem.id) === String(editId);

    if (!matchesCurrentTarget) {
      // Either there's no editId (fresh "new enquiry"), or enquiryItem hasn't
      // caught up to a just-changed editId yet. Reset once per editId change
      // so stale data from a previously-edited enquiry can't linger — but
      // only if we haven't already reset for this target.
      if (hydratedForIdRef.current !== editId) {
        hydratedForIdRef.current = editId;
        setRestoredEditSelections(false);
        setSelectedPackageEquipments({});
        setSelectedExtras({});
        setCustomExtras([]);
        setExtrasOverrides({});
        setPackageEquipmentQty({});
        setPackageEquipmentPrice({});
        setExtrasPrice({});
        setExtrasQty({});
        try { formikRef.current.resetForm(); } catch {}
        if (editId) {
          try {
            queryClient.invalidateQueries({ queryKey: ["enquiry-item", editId], refetchType: "all" });
          } catch {}
        }
      }
      return;
    }

    // enquiryItem now matches editId — hydrate. Mark this target as handled so
    // a later re-run (e.g. a background refetch of the same enquiry) doesn't
    // blow away in-progress edits by resetting again.
    hydratedForIdRef.current = editId;

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
        id: enquiryItem.dj_id ?? enquiryItem.users_events_dj_idTousers?.id ?? enquiryItem.dj?.id ?? "",
        name: enquiryItem.dj_name ?? enquiryItem.users_events_dj_idTousers?.name ?? enquiryItem.dj?.name ?? "",
      },
      eventType: enquiryItem.event_type ?? "",
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

    // Dispatch the whole-form hydration once per editId. A background refetch
    // of the SAME enquiry (new enquiryItem object, same underlying data) still
    // reaches this point, and re-dispatching a wholesale setValues for it would
    // silently discard whatever the user has typed since. Guarding on editId
    // means later refetches leave in-progress edits alone.
    if (formValuesHydratedForIdRef.current !== editId) {
      Promise.resolve().then(() => {
        const formik = formikRef.current;
        // Only claim this editId as hydrated once the dispatch has actually
        // gone out — marking it before the microtask ran would leave the form
        // permanently blank if formikRef were momentarily detached here.
        if (!formik) return;
        formValuesHydratedForIdRef.current = editId;
        // Wholesale replace is correct HERE (unlike the clientDetails effect):
        // newVals is a complete EnquiryFormValues built from this enquiry, so
        // it isn't relying on, and can't drop, anything already in state.
        formik.setValues(newVals);
        try {
          if (nameVal) formik.setFieldValue("name", nameVal, false);
          if (venueVal) formik.setFieldValue("venue", venueVal, false);
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
      const qtyMap: Record<string, number> = {};
      const basicPriceMap: Record<string, number> = {};
      const extraPriceMap: Record<string, number> = {};
      const extraQtyMap: Record<string, number> = {};
      if (Array.isArray(enquiryItem.event_packages)) {
        for (const p of enquiryItem.event_packages) {
          const eqId = p?.equipment_id ?? p?.equipment?.id ?? null;
          if (eqId != null) {
            const key = String(eqId);
            // package_type_id 1/"BASIC" = Starting Package, 2/"EXTRAS" = Extra
            // (see makePackage in the backend enquiry controller). Older rows
            // saved before that FK was populated have package_type_id null —
            // for those, fall back to the old "mark both" behaviour rather
            // than guessing wrong and hiding a legitimately-saved item.
            const typeLabel = String(p?.package_types?.type ?? "").toUpperCase();
            const typeId = p?.package_type_id != null ? String(p.package_type_id) : null;
            const isExtra = typeLabel === "EXTRAS" || typeId === "2";
            const isBasic = typeLabel === "BASIC" || typeId === "1";
            if (isExtra) {
              extrasMap[key] = true;
            } else if (isBasic) {
              pkgMap[key] = true;
            } else {
              pkgMap[key] = true;
              extrasMap[key] = true;
            }
            const savedNotes = p?.notes ?? "";
            const savedRigNotes = p?.rig_notes ?? "";
            if (savedNotes || savedRigNotes) {
              overridesMap[key] = { notes: savedNotes, rig_notes: savedRigNotes };
            }
            // Restore the previously-saved edited quantity for Basics rows
            // (event_package.quantity holds the full edited quantity, same
            // semantics as Laravel) so re-opening a confirmed event's
            // enquiry shows the staff-entered qty rather than resetting to
            // the DJ package's bundled default.
            if ((isBasic || (!isExtra && !isBasic)) && p?.quantity != null) {
              qtyMap[key] = Number(p.quantity);
            }
            // Same for Extras rows. This has to stand on its own rather than
            // hang off the sell_price restore below — an extra saved with a
            // null sell_price would otherwise silently lose its quantity and
            // snap back to 1 on reopen.
            if (isExtra && p?.quantity != null) {
              extraQtyMap[key] = Number(p.quantity);
            }
            // Restore a staff-edited unit price the same way as quantity —
            // event_package.sell_price holds whatever was saved, catalog
            // default or edited, and re-opening this enquiry must show that
            // exact value back rather than silently reverting to catalog.
            if (p?.sell_price != null) {
              if (isExtra) {
                extraPriceMap[key] = Number(p.sell_price);
              } else if (isBasic || (!isExtra && !isBasic)) {
                basicPriceMap[key] = Number(p.sell_price);
              }
            }
          }
        }
      }
      Promise.resolve().then(() => {
        setSelectedPackageEquipments(pkgMap);
        setSelectedExtras(extrasMap);
        setExtrasOverrides(overridesMap);
        setPackageEquipmentQty(qtyMap);
        setPackageEquipmentPrice(basicPriceMap);
        setExtrasPrice(extraPriceMap);
        setExtrasQty(extraQtyMap);
        setRestoredEditSelections(true);
      });
    } catch {}
  }, [enquiryItem, editId, queryClient]);

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
        /* Gate on editId ALONE, not on `restoredEditSelections`.

           With a warm React Query cache this effect and the enquiryItem
           effect can run in the same microtask drain. Because
           `restoredEditSelections` is captured in this closure at render
           time, it still reads false here even when the enquiryItem effect
           has just set it true and restored the saved ticks — so the old
           condition fell through to the hard overwrite below and wiped them.
           That's why selected equipment appeared only after a hard refresh
           (cold cache ⇒ the two effects land in separate ticks).

           In edit mode the saved event_package rows are the source of truth
           for the ORIGINAL DJ, so that initial load must never hard-reset —
           merge in any package/extra keys we don't know about as unticked
           and leave existing (restored) entries alone. The merge is
           idempotent, so the re-run triggered when restoredEditSelections
           flips is harmless.

           BUT once the user has actually picked a *different* DJ from the
           dropdown (djManuallyChangedRef), that "preserve" behaviour is
           wrong: this packageData response is now for a DJ that was never
           saved on this enquiry, so there is no prior selection to protect —
           it should default to fully checked, exactly like the fresh-
           enquiry path below. Without this, switching DJs mid-edit left
           every Starting Package item unticked (merged in as `false`) and
           never checked, since editId being truthy always took the
           preserve-only branch regardless of whether the DJ had changed. */
        if (editId && !djManuallyChangedRef.current) {
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
        // Fresh enquiry, or the user just switched to a different DJ mid-edit:
        // there's no prior saved quantity to protect for this package, so
        // drop any overrides and fall back to the new DJ's bundled defaults
        // (packageEquipmentQty[key] ?? item.quantity, read at render time).
        setPackageEquipmentQty({});
        setPackageEquipmentPrice({});
        setExtrasPrice({});
        setExtrasQty({});

        // Laravel re-checks availability for every Starting Package row when
        // the DJ changes (a different DJ means a different equipment list, so
        // clashes on the event date can appear or disappear). Read straight
        // off initPkg and the bundled defaults — the state setters above have
        // not landed yet inside this closure.
        {
          const eventDateIso = formikRef.current?.values?.eventDate;
          const items: { equipment_id: number; quantity: number }[] = [];
          const rows = (packageData?.data?.equipments?.package_user_equipments ??
            []) as PackageUserEquipment[];
          for (const it of rows) {
            const equipment = it.equipment ?? null;
            const id = it.equipment_id ?? equipment?.id ?? it.id;
            const key = id != null ? String(id) : null;
            if (!key || !initPkg[key]) continue;
            if (!equipment?.is_availabilty_check || equipment?.id == null) continue;
            items.push({
              equipment_id: Number(equipment.id),
              quantity: Number(it.quantity ?? 1),
            });
          }
          if (items.length) {
            checkEquipmentAvailability({
              date: eventDateIso ? dayjs(eventDateIso).format("YYYY-MM-DD") : "",
              items,
            }).then((messages) => messages.forEach((m) => toast.warning(m)));
          }
        }
      });
    }
  }, [packageData, editId, restoredEditSelections]);

  const { equipmentList, rigNotesList, totalPrice } = useMemo(() => {
    const eqList: Array<{ name: string; notes?: string | null }> = [];
    const rnList: Array<{ name: string; rig_notes: string }> = [];
    let total = 0;

    const basePrice = packageData?.data?.equipments?.sell_price ?? 0;
    total += Number(basePrice) || 0;

    // Basics — bundled into the DJ package's base price up to each item's
    // default `quantity` (matches Laravel's price_added_to_bill). Staff can
    // edit the Qty box higher than that default; only the excess over the
    // bundled default gets billed on top of `basePrice` above. No notes;
    // rig_notes only if user entered via modal.
    const pkgEquip = (packageData?.data?.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
    for (const it of pkgEquip) {
      const equipment = it.equipment ?? null;
      const id = it.equipment_id ?? equipment?.id ?? it.id;
      const key = id != null ? String(id) : null;
      if (key && selectedPackageEquipments[key]) {
        const basicQty = Number(it.quantity ?? 1);
        const editedQty = Number(packageEquipmentQty[key] ?? basicQty);
        const unit = Number(packageEquipmentPrice[key] ?? equipment?.sell_price ?? 0);
        const billedQty = Math.max(0, editedQty - basicQty);
        total += unit * billedQty;
        const override = extrasOverrides[key];
        eqList.push({ name: equipment?.name ?? "", notes: null });
        // Fall back to the equipment's own saved rig_notes, same as the Extras
        // loop below does for `ex.rig_notes` — a preselected Basics item's rig
        // note was never reaching here because only the override was checked.
        const rigNotes = override?.rig_notes ?? equipment?.rig_notes ?? "";
        if (rigNotes) rnList.push({ name: equipment?.name ?? "", rig_notes: rigNotes });
      }
    }

    // Extras — notes from modal override or item default; rig_notes from override or item default
    const extras = (packageData?.data?.extras ?? []) as ExtraItem[];
    for (const ex of extras) {
      const id = ex.id;
      const extKey = id != null ? String(id) : "";
      // Extras always start at 1 (Laravel renders these rows with a hardcoded
      // value="1"). `ex.quantity` here is the equipment's total STOCK count,
      // not a per-package default, so it must never be used as the fallback.
      const qty = Number(extrasQty[extKey] ?? 1);
      const unit = Number(extrasPrice[extKey] ?? ex.sell_price ?? 0);
      if (id != null && selectedExtras[String(id)]) {
        total += Number(unit) * Number(qty);
        const override = extrasOverrides[String(id)];
        const notes = override?.notes ?? (ex as ExtraItem & { notes?: string }).notes ?? null;
        eqList.push({ name: ex.name ?? "", notes: notes || null });
        const rigNotes = override?.rig_notes ?? ex.rig_notes ?? "";
        if (rigNotes) rnList.push({ name: ex.name ?? "", rig_notes: rigNotes });
      }
    }

    // Custom extras
    for (const ex of customExtras) {
      if (ex.selected === false) continue;
      total += Number(ex.sell_price) * Number(ex.quantity);
      eqList.push({ name: ex.name, notes: ex.notes || null });
      if (ex.rig_notes) rnList.push({ name: ex.name, rig_notes: ex.rig_notes });
    }

    return { equipmentList: eqList, rigNotesList: rnList, totalPrice: total };
  }, [
    packageData,
    selectedPackageEquipments,
    packageEquipmentQty,
    packageEquipmentPrice,
    selectedExtras,
    extrasOverrides,
    extrasPrice,
    extrasQty,
    customExtras,
  ]);

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

  const resetAddEquipForm = () => {
    setAddEquipForm({ has_equipment: "no", name: "", cost_price: "", sell_price: "", quantity: "", supplier_id: "", supplier_name: "" });
    setShowNewSupplier(false);
  };

  const handleAddEquipmentSave = async () => {
    const ownsEquipment = addEquipForm.has_equipment === "yes";

    if (!addEquipForm.name.trim()) {
      toast.error("Equipment name is required");
      return;
    }
    if (!String(addEquipForm.cost_price).trim()) {
      toast.error("Cost price is required");
      return;
    }
    if (!String(addEquipForm.sell_price).trim()) {
      toast.error("Sell price is required");
      return;
    }
    // Legacy parity: owning the equipment requires a quantity; hiring it in
    // requires a supplier (either picked from the list or typed in as new).
    if (ownsEquipment && !String(addEquipForm.quantity).trim()) {
      toast.error("Quantity is required");
      return;
    }
    if (!ownsEquipment && !addEquipForm.supplier_id && !addEquipForm.supplier_name.trim()) {
      toast.error("Supplier company name is required");
      return;
    }

    const quantity = ownsEquipment ? Number(addEquipForm.quantity) || 1 : 1;

    let equipmentId = 0;
    try {
      const created = await addEquipmentMutation.mutateAsync({
        name: addEquipForm.name,
        cost_price: Number(addEquipForm.cost_price) || 0,
        sell_price: Number(addEquipForm.sell_price) || 0,
        quantity,
        status: "ACTIVE",
        is_availabilty_check: ownsEquipment,
        // Supplier only applies when the item is hired in. `supplier_name`
        // makes the API create the supplier and link it in one call.
        ...(ownsEquipment
          ? {}
          : addEquipForm.supplier_name.trim()
            ? { supplier_name: addEquipForm.supplier_name.trim() }
            : { supplier_id: Number(addEquipForm.supplier_id) || undefined }),
      });
      equipmentId = created?.data?.id ?? created?.id ?? 0;
    } catch {
      return;
    }

    const newExtra: CustomExtra = {
      tempId: `custom-${Date.now()}`,
      equipment_id: equipmentId,
      name: addEquipForm.name,
      sell_price: Number(addEquipForm.sell_price) || 0,
      cost_price: Number(addEquipForm.cost_price) || 0,
      quantity,
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
    eventType: "",
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
          // What USR pays the DJ (matches Laravel's dj-cost-price-for-event, which
          // reads the package's cost_price) — NOT sell_price, which is what the
          // client is billed and is already used as `basePrice` in the total above.
          const djCost = Number(packageData?.data?.equipments?.cost_price ?? 0);

          type EquipmentPayloadItem = {
            equipment_id: number;
            sell_price: number;
            cost_price: number;
            quantity: number;
            total_price: number;
            price_added_to_bill: number;
          };
          type ExtrasPayloadItem = { equipment_id: number; sell_price: number; quantity: number; notes: string | null };
          type RigNotesItem = { equipment_id: number; rig_notes: string | null };
          const equipment_data: EquipmentPayloadItem[] = [];
          const rig_notes_data: RigNotesItem[] = [];

          const pkgEquip = (packageData?.data?.equipments?.package_user_equipments ?? []) as PackageUserEquipment[];
          for (const it of pkgEquip) {
            const equipment = it.equipment ?? null;
            const id = it.equipment_id ?? equipment?.id ?? it.id;
            const key = id != null ? String(id) : null;
            if (key && selectedPackageEquipments[key]) {
              const override = extrasOverrides[key];
              const basicQty = Number(it.quantity ?? 1);
              const qty = Number(packageEquipmentQty[key] ?? basicQty);
              const unit = Number(packageEquipmentPrice[key] ?? equipment?.sell_price ?? 0);
              // Only the quantity edited ABOVE the DJ package's bundled
              // default is billable — matches Laravel's
              // calculatePriceAddedToBill for Basics rows. `total_price`
              // still reflects the full line value (unit × edited qty),
              // same semantics as Laravel's event_package.total_price.
              const billedQty = Math.max(0, qty - basicQty);
              equipment_data.push({
                equipment_id: Number(id),
                sell_price: unit,
                cost_price: Number(equipment?.cost_price ?? 0),
                quantity: qty,
                total_price: unit * qty,
                price_added_to_bill: unit * billedQty,
              });
              // Same fallback as the live rigNotesList computation above — without
              // it, a Basics item relying on the equipment's own default rig note
              // (no manual override) never got saved onto the confirmed event's
              // own event_package.rig_notes at all.
              rig_notes_data.push({
                equipment_id: Number(id),
                rig_notes: (override?.rig_notes ?? equipment?.rig_notes)?.trim() || null,
              });
            }
          }

          const extra_data: ExtrasPayloadItem[] = [];
          const extras = (packageData?.data?.extras ?? []) as ExtraItem[];
          for (const ex of extras) {
            if (ex.id != null && selectedExtras[String(ex.id)]) {
              const override = extrasOverrides[String(ex.id)];
              const extKey = String(ex.id);
              extra_data.push({
                equipment_id: Number(ex.id),
                sell_price: Number(extrasPrice[extKey] ?? ex.sell_price ?? 0),
                quantity: Number(extrasQty[extKey] ?? 1),
                notes: (override?.notes ?? (ex as ExtraItem & { notes?: string }).notes)?.trim() || null,
              });
              rig_notes_data.push({
                equipment_id: Number(ex.id),
                rig_notes: (override?.rig_notes ?? ex.rig_notes)?.trim() || null,
              });
            }
          }

          // Include custom extras
          for (const ex of customExtras) {
            if (ex.selected === false) continue;
            if (ex.equipment_id) {
              extra_data.push({
                equipment_id: ex.equipment_id,
                sell_price: ex.sell_price,
                quantity: ex.quantity,
                notes: ex.notes?.trim() || null,
              });
              rig_notes_data.push({
                equipment_id: ex.equipment_id,
                rig_notes: ex.rig_notes?.trim() || null,
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
            event_type: values.eventType || null,
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
              // Stay on this edit page with the form as-is instead of
              // navigating back to the Open Enquiry list — the user wants to
              // keep working on the same enquiry after saving.
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
              const rawTemplate = (data as { email?: { subject?: string; body?: string; [k: string]: unknown } } | null)?.email ?? null;
              // Substitute the deposit placeholder with what's actually in the
              // form right now, so the compose box shows the real amount
              // instead of the literal "{--amount--}" token before sending.
              const depositAmount = Number(values.depositAmount) || 0;
              const template = rawTemplate
                ? { ...rawTemplate, body: String(rawTemplate.body ?? "").replace("{--amount--}", `£${depositAmount}`) }
                : rawTemplate;
              setSendQuoteData({
                template,
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

          // At a Glance — the scrolling body of the summary panel. The Rig List
          // The Name and Venue fields hold either a dropdown id (when picked from
          // the list) or free text (when entered via "Add new"), so the print
          // sheet has to map an id back to its label — otherwise a selected
          // client prints as a bare row id.
          const printClientName =
            clientDropdownName?.find((c) => String(c.id) === String(values.name))?.name ??
            values.name;
          const printVenueName =
            venueDropdownName?.find((v) => String(v.id) === String(values.venue))?.venue ??
            values.venue;

          // At a Glance + Rig List — the scrolling body of the summary panel.
          const renderSummaryContent = () => (
            <div className="p-6 space-y-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <Spin spinning={isPackageLoading}>
                  <div className="space-y-2">
                    {equipmentList.length ? (
                      equipmentList.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <SquareCheckBig size={14} className="text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{r.name}</p>
                            {r.notes && (
                              <p
                                className="text-xs text-gray-500 italic mt-0.5 whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: r.notes }}
                              />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 py-2">No items selected</p>
                    )}
                    <div className="pt-3 flex justify-center">
                      <div className="rounded-xl bg-primary px-6 py-2 text-xl font-semibold text-white text-center min-w-[110px]">
                        {"£" + (Number(totalPrice) || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Spin>
              </div>

              {/* Rig List — plain toggle row when collapsed; the boxed panel
                  only mounts once expanded, so no empty box lingers. Stays
                  inside the panel's own scroll area (rather than being pinned as
                  a footer) because this is the layout already signed off — the
                  cropping it used to suffer from was a height bug, not a
                  placement one, and is fixed on the `aside` below. */}
              <div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary"
                    onClick={() => setCardsOpen((s) => ({ ...s, rigList: !s.rigList }))}
                    aria-expanded={cardsOpen.rigList}
                  >
                    Rig List
                    <Plus size={15} className={`transition-transform duration-300 ${cardsOpen.rigList ? "rotate-45" : ""}`} />
                  </button>
                </div>
                {cardsOpen.rigList && (
                  <Spin spinning={isPackageLoading}>
                    <div className="mt-2 text-sm text-gray-700 space-y-3">
                      {rigNotesList.length ? (
                        rigNotesList.map((r, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <SquareCheckBig size={14} className="text-primary shrink-0" />
                              <p className="font-semibold text-gray-900 leading-tight">{r.name}</p>
                            </div>
                            <p className="pl-6 text-[11px] text-gray-500 leading-snug whitespace-pre-line" dangerouslySetInnerHTML={{ __html: r.rig_notes ?? "" }} />
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-500 py-2">No rig notes</p>
                      )}
                    </div>
                  </Spin>
                )}
              </div>
            </div>
          );

          return (
            <Form>
              <div className="mt-8 space-y-6">
                {/* Header row */}
                <div className="flex flex-col gap-3 justify-between lg:flex-row lg:items-center">
                  <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                      <BackButton />
                    </Link>
                    <h2 className="themeH1">{editId ? "Edit Enquiry" : "New Enquiry"}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button
                      type="default"
                      icon={<Save size={14} />}
                      htmlType="submit"
                      loading={isSubmitting}
                      disabled={!dirty || isSubmitting}
                    >
                      {editId ? "Update" : "Save"}
                    </Button>
                    {/* Prints the enquiry as it stands — every form field plus the
                        package and rig notes. (This used to call a bare
                        `window.print()`, which hit the old
                        `body * { visibility: hidden }` rule and sent a blank
                        sheet every time: the `#print-section` it revealed was
                        never rendered by anything.) */}
                    <Button
                      type="default"
                      icon={<Printer size={14} />}
                      onClick={() => setPrintMode("enquiry")}
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
                    {/* Toggles the inline summary sidebar (only has anything to
                        show once a DJ is picked). */}
                    <Button
                      type="default"
                      htmlType="button"
                      onClick={() => setShowSummaryDrawer((v) => !v)}
                      aria-label={showSummaryDrawer ? "Hide summary" : "Show summary"}
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </div>
                </div>

                {/* Flex rather than a 12-column grid — see the matching comment
                    on the Open Enquiry page. The panel width the two pages share
                    falls between two grid steps, so both state it directly. */}
                <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Enquiry Details card — collapsible */}
                    <Card variant="white" className="p-0 overflow-hidden">
                      <div className="flex items-center justify-between bg-primary px-6 h-[60px] text-white">
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
                        {/* Capped to the same total content height as Starting Package
                            and Extras below (their cap + outer padding + column-header
                            row ≈ 480px too), so the three cards read as equal height.
                            This div's own py-5 padding counts toward the 480 budget,
                            unlike theirs which sits outside the capped list — hence the
                            slightly different number for the same visual result. */}
                        <div className="max-h-[480px] overflow-y-auto no-scrollbar space-y-6 px-6 py-5">
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
                                    <AntSelect
                                      className="h-10 w-full"
                                      placeholder="Select Name"
                                      showSearch
                                      allowClear
                                      optionFilterProp="label"
                                      disabled={isSubmitting}
                                      value={clientId != null ? String(clientId) : (values.name ? String(values.name) : undefined)}
                                      onChange={(val) => {
                                        const selectedId = val ?? "";
                                        setClientId(selectedId ? Number(selectedId) : null);
                                        setFieldValue("name", String(selectedId));
                                      }}
                                      options={clientDropdownName?.map((opt) => ({
                                        label: opt.name,
                                        value: String(opt.id),
                                      }))}
                                    />
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
                                    disabled={isSubmitting}
                                    error={touched.address ? (errors.address as string | undefined) : undefined}
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
                                    disabled={isSubmitting}
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
                                      disabled={isSubmitting}
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
                                          <AntSelect
                                            className="h-10 w-full"
                                            placeholder="Select a venue"
                                            showSearch
                                            allowClear
                                            optionFilterProp="label"
                                            disabled={isSubmitting}
                                            value={fieldProps.field.value ? String(fieldProps.field.value) : undefined}
                                            onChange={(val) => setFieldValue("venue", val ?? "")}
                                            options={venueDropdownName?.map((venue) => ({
                                              label: venue.venue,
                                              value: String(venue.id),
                                            }))}
                                          />
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
                            </div>

                            {/* Right sub-column */}
                            <div className="flex h-full flex-col gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <Field name="dj">
                                  {(fieldProps: FieldProps) => {
                                    // One option per (DJ, package) combo — a DJ with several
                                    // packages (Wedding, Basic, Destination Wedding) gets one
                                    // row per package rather than silently defaulting to
                                    // package_users[0]. Composite value since dj.id alone is
                                    // no longer unique per option.
                                    const djPackageOptions = (djOptionsData ?? []).flatMap((dj) => {
                                      const packages = dj.package_users ?? [];
                                      if (packages.length === 0) {
                                        return [{ label: `${dj.name} ()`, value: `${dj.id}::` }];
                                      }
                                      return packages.map((p: { id: string; package_name: string }) => ({
                                        label: `${dj.name} (${p.package_name})`,
                                        value: `${dj.id}::${p.package_name}`,
                                      }));
                                    });
                                    const selectedValue =
                                      values.dj?.id != null
                                        ? `${values.dj.id}::${packageParams.package_name ?? ""}`
                                        : undefined;
                                    return (
                                    <div className="space-y-1">
                                      <label className="mb-1 block text-xs">Select DJ</label>
                                      <AntSelect
                                        className="h-10 w-full"
                                        placeholder="Choose DJ"
                                        showSearch
                                        allowClear
                                        optionFilterProp="label"
                                        disabled={isSubmitting}
                                        loading={isPackageLoading}
                                        value={selectedValue}
                                        onChange={(val) => {
                                          const [djIdPart, packageNamePart] = (val ?? "").split("::");
                                          const value = Number(djIdPart);
                                          const selectedDj = djOptionsData?.find((item) => item.id === value);
                                          const eventDateFormatted =
                                            packageParams.event_date ||
                                            (values.eventDate
                                              ? dayjs(values.eventDate).format("DD-MM-YYYY")
                                              : dayjs().format("DD-MM-YYYY"));
                                          // A user-driven DJ change (as opposed to the edit
                                          // page hydrating packageParams.staff from the saved
                                          // enquiry) means: default the newly-picked DJ's
                                          // Starting Package to fully checked, same as the
                                          // fresh-enquiry flow. See the packageData effect for
                                          // the other half of this fix.
                                          djManuallyChangedRef.current = true;
                                          setPackageParams((prev) => ({
                                            ...prev,
                                            staff: selectedDj?.id ?? null,
                                            package_name: packageNamePart ?? "",
                                            event_date: eventDateFormatted,
                                          }));
                                          setFieldValue("dj", selectedDj ?? null);
                                        }}
                                        options={djPackageOptions}
                                      />
                                      {touched.dj && !!djError && (
                                        <div className="text-red-500 text-xs mt-1">{djError}</div>
                                      )}
                                    </div>
                                    );
                                  }}
                                </Field>
                                <Field name="eventType">
                                  {(fieldProps: FieldProps) => (
                                    <div className="space-y-1">
                                      <label className="mb-1 block text-xs">Event Type</label>
                                      <AntSelect
                                        className="h-10 w-full"
                                        placeholder="Select event type"
                                        allowClear
                                        disabled={isSubmitting}
                                        value={fieldProps.field.value || undefined}
                                        onChange={(val) => {
                                          setFieldValue("eventType", val ?? "");
                                          // Wedding Reception always defaults to a
                                          // £1000 deposit; every other type leaves
                                          // the box for staff to fill in themselves.
                                          if (val === "Wedding Reception") {
                                            setFieldValue("depositAmount", 1000);
                                          }
                                        }}
                                        options={EVENT_TYPES.map((type) => ({ label: type, value: type }))}
                                      />
                                    </div>
                                  )}
                                </Field>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <Field name="eventDate">
                                  {() => (
                                    <div className="space-y-1">
                                      <label className="mb-1 block text-xs">Event Date <span className="text-red-500">*</span></label>
                                      <DatePicker
                                        className="h-10 w-full"
                                        placeholder="DD/MM/YYYY"
                                        format="DD/MM/YYYY"
                                        disabled={isPackageLoading || isSubmitting}
                                        value={values.eventDate ? dayjs(values.eventDate) : null}
                                        onChange={(val) => {
                                          const iso = val ? val.toISOString() : "";
                                          const formatted = val ? val.format("DD-MM-YYYY") : "";
                                          setFieldValue("eventDate", iso);
                                          setPackageParams((prev) => ({ ...prev, event_date: formatted }));
                                          runOverbookCheckAll(iso);
                                        }}
                                      />
                                      {touched.eventDate && errors.eventDate && (
                                        <div className="text-red-500 text-xs mt-1">{errors.eventDate as string}</div>
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
                                        disabled={isSubmitting}
                                        error={touched.depositAmount ? (errors.depositAmount as string | undefined) : undefined}
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
                                        disabled={isSubmitting}
                                        error={touched.startTime ? (errors.startTime as string | undefined) : undefined}
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
                                        disabled={isSubmitting}
                                        error={touched.endTime ? (errors.endTime as string | undefined) : undefined}
                                        value={fieldProps.field.value}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue("endTime", e.target.value)}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => setFieldValue("endTime", parseTimeTo24(e.target.value))}
                                      />
                                    </div>
                                  )}
                                </Field>
                              </div>
                                                            <Field name="tellMeMore">
                                {(fieldProps: FieldProps) => (
                                  <div className="flex flex-1 flex-col space-y-1">
                                    <label className="mb-1 block text-xs">Tell me more</label>
                                    <textarea
                                      {...fieldProps.field}
                                      className="min-h-[72px] w-full flex-1 rounded-xl border border-gray-200 bg-secondary-100 px-3 py-2 text-sm outline-none"
                                      placeholder="Additional information about the enquiry"
                                    />
                                    {touched.tellMeMore && errors.tellMeMore && (
                                      <div className="text-red-500 text-xs">{errors.tellMeMore}</div>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Starting Package */}
                    <Card variant="white" className="p-0 overflow-hidden border border-primary/30">
                      <div className="flex items-center justify-between bg-primary px-6 h-[60px] text-white">
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
                        <Spin spinning={isPackageLoading}>
                        <div className="px-6 text-sm text-gray-700">
                          <div className="mb-2 flex items-center text-xs text-gray-500">
                            <span className="w-6/12">Basics</span>
                            <span className="w-2/12 text-center">Unit Price</span>
                            <span className="w-1/12 text-center">Qty</span>
                            <span className="w-1/12 text-center">Price</span>
                            <span className="w-2/12 text-center">Notes</span>
                          </div>
                          {/* Same scroll cap as Enquiry Details and Extras, so the
                              three cards read as equal height. */}
                          <div className="max-h-[420px] overflow-y-auto no-scrollbar space-y-2">
                            {packageData?.data?.equipments?.package_user_equipments?.map(
                              (item: PackageUserEquipment, idx: number) => {
                                const equipment = item.equipment ?? null;
                                const id = item.equipment_id ?? equipment?.id ?? item.id ?? `pkg-${idx}`;
                                const key = String(id);
                                // Unit price is editable (matches Laravel's
                                // dblclick-to-edit sell price field) so staff
                                // can apply a discount per line item — missing
                                // key falls back to the equipment's catalog price.
                                const unitPrice = Number(packageEquipmentPrice[key] ?? equipment?.sell_price ?? 0);
                                // The DJ package bundles `basicQty` of this item for
                                // free; staff can bump the Qty box higher (matches
                                // Laravel's editable spinner), and only the excess
                                // over the bundled default is billed.
                                const basicQty = Number(item.quantity ?? 1);
                                const editedQty = Number(packageEquipmentQty[key] ?? basicQty);
                                const billedQty = Math.max(0, editedQty - basicQty);
                                const billedPrice = unitPrice * billedQty;
                                const checked = Boolean(selectedPackageEquipments[key]);
                                return (
                                  <div
                                    key={key}
                                    className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-sm"
                                  >
                                    <div className="flex w-6/12 items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const nowChecked = !selectedPackageEquipments[key];
                                          setSelectedPackageEquipments((prev) => ({
                                            ...prev,
                                            [key]: nowChecked,
                                          }));
                                          if (nowChecked) {
                                            runOverbookCheck(
                                              values.eventDate,
                                              equipment?.id,
                                              editedQty,
                                              equipment?.is_availabilty_check,
                                            );
                                          }
                                        }}
                                        className="size-4 rounded accent-primary cursor-pointer"
                                      />
                                      <span>{equipment?.name}</span>
                                    </div>
                                    <div className="w-2/12 flex justify-center">
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={unitPrice}
                                        disabled={!checked}
                                        onChange={(e) => {
                                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                                          setPackageEquipmentPrice((prev) => ({
                                            ...prev,
                                            [key]: Number.isFinite(val) ? val : 0,
                                          }));
                                        }}
                                        className="h-8 w-16 rounded-lg border border-gray-200 bg-white px-1 text-center text-sm outline-none focus:border-primary transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                                      />
                                    </div>
                                    <div className="w-1/12 flex justify-center">
                                      <input
                                        type="number"
                                        min={1}
                                        value={editedQty}
                                        disabled={!checked}
                                        onChange={(e) => {
                                          const raw = e.target.value === "" ? NaN : Number(e.target.value);
                                          // Matches Laravel's keyup handler: reducing the
                                          // quantity down to 0 snaps it back to the
                                          // package's bundled default rather than staying
                                          // at 0. Anything else floors at 1 — the spinner
                                          // must never step below it (Laravel's min="1").
                                          const val =
                                            !Number.isFinite(raw) || raw <= 0
                                              ? Math.max(1, basicQty)
                                              : Math.max(1, raw);
                                          setPackageEquipmentQty((prev) => ({
                                            ...prev,
                                            [key]: val,
                                          }));
                                          // Laravel only fires the availability check on a
                                          // Starting Package row once the qty goes ABOVE the
                                          // bundled allowance — within it the stock is already
                                          // accounted for by the package itself.
                                          if (val > basicQty) {
                                            runOverbookCheck(
                                              values.eventDate,
                                              equipment?.id,
                                              val,
                                              equipment?.is_availabilty_check,
                                            );
                                          }
                                        }}
                                        className="h-8 w-14 rounded-lg border border-gray-200 bg-white px-1 text-center text-sm outline-none focus:border-primary transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                                      />
                                    </div>
                                    <div className="w-1/12 text-center">{billedPrice}</div>
                                    <div className="w-2/12 text-center">{billedPrice}</div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                        </Spin>
                      </div>
                    </Card>

                    {/* Extras */}
                    <Card variant="white" className="p-0 overflow-hidden border border-primary/30">
                      <div className="flex items-center justify-between bg-primary px-6 h-[60px] text-white">
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
                        <Spin spinning={isPackageLoading}>
                        <div className="px-6 text-sm text-gray-700">
                          <div className="mb-2 flex items-center text-xs text-gray-500">
                            <span className="w-6/12">Extras</span>
                            <span className="w-2/12 text-center">Unit Price</span>
                            <span className="w-1/12 text-center">Qty</span>
                            <span className="w-1/12 text-center">Price</span>
                            <span className="w-2/12 text-center">Notes</span>
                          </div>
                          <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar">
                            {/* Package extras */}
                            {packageData?.data?.extras?.map((extra: ExtraItem) => {
                              const id = extra.id;
                              const key = String(id ?? "");
                              // Both price and quantity are editable (matches
                              // Laravel's dblclick-to-edit fields for Extras
                              // rows) — missing key falls back to the
                              // package's saved defaults.
                              const unitPrice = Number(extrasPrice[key] ?? extra.sell_price ?? 0);
                              const qty = Number(extrasQty[key] ?? 1);
                              const price = unitPrice * qty;
                              const override = extrasOverrides[key];
                              const checked = Boolean(selectedExtras[key]);
                              return (
                                <div
                                  key={id}
                                  className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-sm"
                                >
                                  <div className="flex w-6/12 items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const nowChecked = !selectedExtras[key];
                                        setSelectedExtras((prev) => ({
                                          ...prev,
                                          [key]: nowChecked,
                                        }));
                                        if (nowChecked) {
                                          runOverbookCheck(
                                            values.eventDate,
                                            extra.id,
                                            qty,
                                            extra.is_availabilty_check,
                                          );
                                        }
                                      }}
                                      className="size-4 rounded accent-primary cursor-pointer"
                                    />
                                    <span>{extra.name}</span>
                                  </div>
                                  <div className="w-2/12 flex justify-center">
                                    <input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={unitPrice}
                                      disabled={!checked}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                                        setExtrasPrice((prev) => ({
                                          ...prev,
                                          [key]: Number.isFinite(val) ? val : 0,
                                        }));
                                      }}
                                      className="h-8 w-16 rounded-lg border border-gray-200 bg-white px-1 text-center text-sm outline-none focus:border-primary transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                  </div>
                                  <div className="w-1/12 flex justify-center">
                                    <input
                                      type="number"
                                      min={1}
                                      value={qty}
                                      disabled={!checked}
                                      onChange={(e) => {
                                        const raw = e.target.value === "" ? 1 : Number(e.target.value);
                                        // Floor at 1 — Laravel's Extras qty input is
                                        // min="1", so stepping down stops there.
                                        const val = Number.isFinite(raw) ? Math.max(1, raw) : 1;
                                        setExtrasQty((prev) => ({
                                          ...prev,
                                          [key]: val,
                                        }));
                                        runOverbookCheck(
                                          values.eventDate,
                                          extra.id,
                                          val,
                                          extra.is_availabilty_check,
                                        );
                                      }}
                                      className="h-8 w-14 rounded-lg border border-gray-200 bg-white px-1 text-center text-sm outline-none focus:border-primary transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                  </div>
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

                            {/* Custom extras */}
                            {customExtras.map((ex) => {
                              const price = ex.sell_price * ex.quantity;
                              return (
                                <div
                                  key={ex.tempId}
                                  className="flex items-center rounded-2xl bg-secondary-50/60 px-3 py-2 text-sm"
                                >
                                  <div className="flex w-6/12 items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={ex.selected !== false}
                                      onChange={(e) =>
                                        setCustomExtras((prev) =>
                                          prev.map((c) =>
                                            c.tempId === ex.tempId ? { ...c, selected: e.target.checked } : c,
                                          ),
                                        )
                                      }
                                      className="size-4 rounded accent-primary"
                                    />
                                    <span>{ex.name}</span>
                                  </div>
                                  <div className="w-2/12 text-center">{ex.sell_price}</div>
                                  <div className="w-1/12 text-center">{ex.quantity}</div>
                                  <div className="w-1/12 text-center">{price}</div>
                                  {/* Same width as the predefined rows' Notes column, so the
                                      tick sits dead-center at the exact same x-position as
                                      theirs. The Remove button is absolutely positioned just
                                      to its right so it doesn't shift that centering or widen
                                      the row. */}
                                  <div className="w-2/12 relative flex justify-center">
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
                                      className="absolute left-full top-1/2 -translate-y-1/2 ml-1.5 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        </Spin>
                      </div>
                    </Card>

                    {/* Add New Equipment — primary button below Extras card.
                        Equipment CRUD is Admin/Super Admin only on the backend
                        (matches the legacy Laravel CRM's can:user gate) — Staff
                        never had it, so hide this rather than let it 403. */}
                    {isAdmin && (
                      <div className="flex justify-end">
                        <Button
                          type="primary"
                          onClick={() => setAddEquipModalOpen(true)}
                          className="w-auto flex items-end justify-center gap-2"
                        >
                          <PlusIcon size={15} />
                          Add New Equipment
                        </Button>
                      </div>
                    )}
                  </div>

                {/* Inline sidebar — no separate drawer/overlay. Only once a DJ is
                    picked (item 8: "must remain visible as we build the
                    package"), and only while the 3-dot toggle has it open.

                    Sticky geometry, all in CSS, and the numbers are measured
                    rather than guessed — see below.

                    The scrollport is the `overflow-y-auto` box in LayoutClient,
                    not the window. Two separate paddings sit above this panel:
                    the shell's outer `p-6` (24px) and that scroll box's own
                    `p-8` (32px). The catch is that a sticky offset resolves
                    against the scroll container's CONTENT box, so the 32px is
                    added to whatever `top` says — a plain `top-4` pinned the
                    panel 72px down the viewport (24 + 32 + 16), which is the
                    oversized head gap, and pushed its bottom edge flush against
                    the screen so it read as cut off.

                    Hence the negative offset: -24px cancels most of that 32px
                    and lands the panel a deliberate 32px from the top. Height is
                    then fixed at `100vh-64px` so the bottom lands 32px up from
                    the viewport floor — an even margin top and bottom that holds
                    at any window height, with the panel's own body scrolling
                    inside it.

                    -24px is safe: the scrollport clips at its PADDING box, which
                    is 32px above the content box, so the panel still sits 8px
                    inside the clip boundary. Anything past -32px would start
                    shearing off the panel's header.

                    A fixed `h-` (not `max-h-`) is deliberate — the panel keeps
                    one constant size as you scroll instead of resizing with its
                    contents.

                    Below `xl` the panel is stacked full-width under the form, so
                    neither the pin nor the height applies and it flows naturally.

                    The aside itself must keep the grid's default
                    `align-items: stretch` — it is the sticky element's travel
                    space. Adding `self-start` here would shrink it to the
                    panel's own height and the pin would have nothing to slide
                    against. */}
                {values.dj?.id && showSummaryDrawer && (
                  <aside className="xl:w-[29%] xl:shrink-0">
                    <div className="xl:sticky xl:-top-6 xl:h-[calc(100vh-64px)] flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
                      {/* Same fixed height as the Enquiry Details header so the
                          two line up exactly, as on the Open Enquiry page. */}
                      <div className="px-6 h-[60px] shrink-0 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-white to-slate-50">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">At a Glance</p>
                          <h3 className="themeH1 text-base truncate leading-tight">{values.dj?.name || "Summary"}</h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Prints the rig list and its notes only — the narrow
                              sheet the crew actually carries. The page header's
                              Print button covers the full enquiry. */}
                          <button
                            type="button"
                            onClick={() => setPrintMode("rig")}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            aria-label="Print rig list"
                            title="Print rig list and notes"
                          >
                            <Printer size={17} className="text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSummaryDrawer(false)}
                            className="p-2 -mr-2 hover:bg-gray-200 rounded-lg transition-colors"
                            aria-label="Hide summary"
                          >
                            <X size={18} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                        {renderSummaryContent()}
                      </div>
                    </div>
                  </aside>
                )}

                {/* Print sheets. Rendered on <body>, hidden on screen, revealed
                    only for the duration of a print.

                    Theming is done with the brand green as *text and rules*
                    rather than filled bars: browsers drop background colours from
                    print output unless the user ticks "background graphics", so a
                    green header block would come out blank on most printers while
                    green type and rules always render. No flex/grid either — a
                    paginated sheet breaks those across pages badly.

                    `values` here is live Formik state, so an untouched form
                    prints as a blank pro-forma with every label and its rule
                    intact, which is what makes it usable as something to fill in
                    by hand on site. */}
                {printMode &&
                  createPortal(
                    <div id="print-section" className="p-2 text-black">
                      <div className="mb-4 border-b-2 border-[#719984] pb-2">
                        <h1 className="text-lg font-semibold text-[#719984]">
                          {printMode === "rig" ? "Rig List" : "Event Enquiry"}
                        </h1>
                        {values.dj?.name && (
                          <p className="text-xs">{values.dj.name}</p>
                        )}
                      </div>

                      {printMode === "enquiry" ? (
                        <>
                          {/* Every field, blank ones included — an untouched
                              form prints as a fill-in-by-hand pro-forma. */}
                          <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#719984]">
                            Enquiry Details
                          </h2>
                          <table className="mb-5 w-full text-xs">
                            <tbody>
                              {[
                                ["Name", printClientName],
                                ["Address", values.address],
                                ["Email", values.email],
                                ["Number", values.number],
                                ["Venue", printVenueName],
                                ["DJ / Package", values.dj?.name],
                                ["Event Date", values.eventDate],
                                ["Start Time", values.startTime || "–"],
                                ["End Time", values.endTime || "–"],
                                [
                                  "Deposit Amount",
                                  values.depositAmount
                                    ? `£${Number(values.depositAmount).toLocaleString()}`
                                    : "",
                                ],
                                ["Tell Me More", values.tellMeMore],
                              ].map(([label, v]) => (
                                <tr key={String(label)} className="border-b border-gray-300">
                                  <td className="w-40 py-1.5 pr-4 align-top font-medium">
                                    {label}
                                  </td>
                                  <td className="py-1.5 align-top whitespace-pre-line">
                                    {v || "\u00a0"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      ) : (
                        /* Rig sheet: just enough to identify the job, then
                           straight into the kit. Blank rows are skipped — this
                           sheet is a reference to work from, not a form. */
                        <table className="mb-5 text-xs">
                          <tbody>
                            {[
                              ["Client", printClientName],
                              ["Venue", printVenueName],
                              ["Event Date", values.eventDate],
                              [
                                "Time",
                                values.startTime && values.endTime
                                  ? `${values.startTime} – ${values.endTime}`
                                  : values.startTime,
                              ],
                            ]
                              .filter(([, v]) => Boolean(v))
                              .map(([label, v]) => (
                                <tr key={String(label)}>
                                  <td className="pr-4 align-top font-medium">{label}</td>
                                  <td className="align-top">{v}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      )}

                      {/* Equipment belongs on BOTH sheets — it is the substance
                          of the rig list, and making it enquiry-only is what left
                          the rig sheet with nothing but a "No rig notes" line. */}
                      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#719984]">
                        {printMode === "enquiry" ? "Package" : "Equipment"}
                      </h2>
                      {equipmentList.length ? (
                        <ul className="mb-5 text-xs">
                          {equipmentList.map((r, i) => (
                            <li key={i} className="border-b border-gray-300 py-1.5">
                              <span className="font-medium">{r.name}</span>
                              {r.notes && (
                                <>
                                  {" — "}
                                  <span
                                    className="whitespace-pre-line italic"
                                    dangerouslySetInnerHTML={{ __html: r.notes }}
                                  />
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mb-5 text-xs italic">No items selected</p>
                      )}

                      <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#719984]">
                        Rig Notes
                      </h2>
                      {rigNotesList.length ? (
                        <ul className="text-xs">
                          {rigNotesList.map((r, i) => (
                            <li key={i} className="border-b border-gray-300 py-1.5">
                              <p className="font-medium">{r.name}</p>
                              <p
                                className="whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: r.rig_notes ?? "" }}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs italic">No rig notes</p>
                      )}

                      {printMode === "enquiry" && (
                        <p className="mt-5 border-t-2 border-[#719984] pt-2 text-sm font-semibold">
                          Total:{" "}
                          <span className="text-[#719984]">
                            {"£" + (Number(totalPrice) || 0).toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>,
                    document.body,
                  )}
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
          {/* "Do you have the equipment?" comes first, per the Figma design —
              it decides whether the form below asks for a Quantity (we own it)
              or a Supplier (hired in, and this equipment gets linked to them). */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Do you have the equipment? <span className="text-red-500">*</span>
            </label>
            <AntSelect
              className="w-full"
              value={addEquipForm.has_equipment}
              onChange={(val: "yes" | "no") =>
                setAddEquipForm((prev) => ({
                  ...prev,
                  has_equipment: val,
                  quantity: "",
                  supplier_id: "",
                  supplier_name: "",
                }))
              }
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Equipment Name <span className="text-red-500">*</span>
            </label>
            <input
              className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
              placeholder="Equipment name"
              value={addEquipForm.name}
              onChange={(e) => setAddEquipForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Cost Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0"
              value={addEquipForm.cost_price}
              onChange={(e) => setAddEquipForm((prev) => ({ ...prev, cost_price: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Sell Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0"
              value={addEquipForm.sell_price}
              onChange={(e) => setAddEquipForm((prev) => ({ ...prev, sell_price: e.target.value }))}
            />
          </div>

          {addEquipForm.has_equipment === "yes" ? (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
                placeholder="Enter Quantity"
                value={addEquipForm.quantity}
                onChange={(e) => setAddEquipForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
          ) : (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  Supplier Company Name <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary"
                  onClick={() => {
                    setShowNewSupplier((v) => !v);
                    setAddEquipForm((prev) => ({ ...prev, supplier_id: "", supplier_name: "" }));
                  }}
                >
                  {showNewSupplier ? "Select Existing" : "+ Add New Supplier"}
                </button>
              </div>
              {showNewSupplier ? (
                <input
                  className="h-10 w-full rounded-xl border border-gray-200 bg-secondary-100 px-3 text-sm outline-none focus:border-primary transition-colors"
                  placeholder="New Supplier Name"
                  value={addEquipForm.supplier_name}
                  onChange={(e) => setAddEquipForm((prev) => ({ ...prev, supplier_name: e.target.value }))}
                />
              ) : (
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
              )}
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <Button
              className="min-w-[90px]!"
              onClick={() => { setAddEquipModalOpen(false); resetAddEquipForm(); }}
            >
              Close
            </Button>
            <Button type="primary" className="min-w-[90px]!" onClick={handleAddEquipmentSave} loading={addEquipmentMutation.isPending} disabled={addEquipmentMutation.isPending}>
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
