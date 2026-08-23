import { useMutation } from "@tanstack/react-query";
import axios from "axios";

// Public axios instance (no auth interceptor) for the unauthenticated
// website enquiry form — same pattern as contracts.ts's PublicAxios, so a
// 401 anywhere else in the app never redirects this page to /login.
const PublicAxios = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api`,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

export type PublicEnquiryPayload = {
  name: string;
  email: string;
  contact_number: string;
  event_date: string; // YYYY-MM-DD
  event_type?: string;
  venue?: string;
  event_details?: string;
  // Honeypot — always sent empty by real visitors; a bot filling every
  // input will populate it, and the backend silently no-ops on it.
  company_website?: string;
};

export function useSubmitPublicEnquiry() {
  return useMutation({
    mutationFn: async (payload: PublicEnquiryPayload) => {
      const resp = await PublicAxios.post<{ success: boolean; message: string }>(
        "/enquiry-form",
        payload,
      );
      return resp.data;
    },
  });
}

// The legacy Laravel form's public endpoint — still live, still used as the
// old CRM's intake, and not something this codebase can change. It's
// unauthenticated with allowed_origins: '*' in its CORS config, so a direct
// browser POST works with zero changes on that side. Only understands 5
// fields (name, email, contact_number, event_date, event_details); the 2
// new fields (event_type, venue) simply aren't sent to it.
//
// This is fire-and-forget by design: Laravel's own validation is stricter
// than ours in a couple of spots (name letters-only, contact_number
// digits-only 11-15 long) and rejecting a legitimate visitor there should
// never block or fail their submission to the new CRM, which is what
// actually matters going forward.
const LARAVEL_ENQUIRY_URL =
  process.env.NEXT_PUBLIC_LARAVEL_ENQUIRY_URL || "https://dev.usrmusic.com/api/enquiry-form";

export async function submitToLaravelEnquiryForm(payload: {
  name: string;
  email: string;
  contact_number: string;
  event_date: string;
  event_details?: string;
}) {
  // Laravel's contact_number rule is `numeric` + 11-15 digits — strip
  // everything but digits so a "+44 7123 456789"-style input still passes.
  const digitsOnly = payload.contact_number.replace(/\D/g, "");
  await axios.post(
    LARAVEL_ENQUIRY_URL,
    {
      name: payload.name,
      email: payload.email,
      contact_number: digitsOnly,
      event_date: payload.event_date,
      event_details: payload.event_details || "",
    },
    { headers: { "Content-Type": "application/json" } },
  );
}
