"use client";

import { useState } from "react";
import { useSubmitPublicEnquiry, submitToLaravelEnquiryForm } from "@/src/api/publicEnquiry";

// Public website enquiry form — no auth, no sidebar. Embedded on the
// Squarespace site via <iframe src=".../enquiry-form">, replacing the old
// Laravel-hosted iframe target (usrmusic_rep/resources/views/enquiry_form.blade.php).
// Deliberately mirrors that form's look (labels, spacing, button style,
// success alert) so the visitor-facing experience doesn't change, on top of
// the 2 new fields (Type of Event, Venue).
//
// On submit, this dual-writes: all 7 fields go to the new Node CRM
// (authoritative — its result drives the success/error UI), and the
// original 5 fields also go, fire-and-forget, to Laravel's existing public
// endpoint so that CRM keeps receiving leads too. See publicEnquiry.ts for
// why that second call never blocks or fails the visitor's submission.

const EVENT_TYPES = [
  "Wedding Reception",
  "Destination Wedding",
  "Corporate",
  "Jago/Sangeet",
  "Other",
];

type FormState = {
  name: string;
  email: string;
  contact_number: string;
  event_date: string;
  event_type: string;
  venue: string;
  event_details: string;
  company_website: string; // honeypot, always left blank
};

const initialState: FormState = {
  name: "",
  email: "",
  contact_number: "",
  event_date: "",
  event_type: "",
  venue: "",
  event_details: "",
  company_website: "",
};

export default function PublicEnquiryFormPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitMutation = useSubmitPublicEnquiry();

  const update = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  // Mirrors Laravel's EnquiryRequest rules exactly (usrmusic_rep/app/Http/Requests/EnquiryRequest.php)
  // so a visitor never sees "Thank you" here only to have their enquiry
  // silently rejected by the fire-and-forget Laravel forward:
  //   name            required|regex:/^[a-zA-Z\s]+$/         (letters and spaces only)
  //   email           required|email|lowercase
  //   contact_number  required|numeric|min_digits:11|max_digits:15
  //   event_date      required|date|after_or_equal:today
  //   event_details   required
  // Our own Node endpoint is more lenient on all of these, so tightening to
  // Laravel's stricter rules here doesn't break that submission.
  const NAME_PATTERN = /^[a-zA-Z\s]+$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Single source of truth for one field's error, so live per-field
  // validation (onBlur, below) and full validation (on submit) can never
  // drift out of sync with each other.
  const validateField = (field: keyof FormState, snapshot: FormState): string => {
    switch (field) {
      case "name": {
        const trimmed = snapshot.name.trim();
        if (!trimmed) return "The name field is required.";
        if (!NAME_PATTERN.test(trimmed)) return "Name can only contain letters and spaces.";
        return "";
      }
      case "email": {
        const trimmed = snapshot.email.trim();
        if (!trimmed) return "The email field is required.";
        if (!EMAIL_PATTERN.test(trimmed)) return "Please enter a valid email address.";
        return "";
      }
      case "contact_number": {
        if (!snapshot.contact_number.trim()) return "The contact number field is required.";
        const digitsOnly = snapshot.contact_number.replace(/\D/g, "");
        if (digitsOnly.length < 11 || digitsOnly.length > 15)
          return "Contact number must be between 11 and 15 digits.";
        return "";
      }
      case "event_date": {
        if (!snapshot.event_date) return "The event date field is required.";
        if (snapshot.event_date < new Date().toISOString().slice(0, 10))
          return "Event date must be today or later.";
        return "";
      }
      case "event_details":
        return snapshot.event_details.trim() ? "" : "The event details field is required.";
      default:
        return "";
    }
  };

  const VALIDATED_FIELDS: (keyof FormState)[] = [
    "name",
    "email",
    "contact_number",
    "event_date",
    "event_details",
  ];

  const handleBlur = (field: keyof FormState) => () => {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form) }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    VALIDATED_FIELDS.forEach((field) => {
      const message = validateField(field, form);
      if (message) next[field] = message;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Laravel's `lowercase` rule requires the value to already be
    // lowercase, not just valid — normalize invisibly rather than making
    // the visitor retype a perfectly deliverable "Name@Example.com".
    const normalized = { ...form, email: form.email.trim().toLowerCase(), name: form.name.trim() };
    try {
      await submitMutation.mutateAsync(normalized);
      // Fire-and-forget: never awaited into the try/catch's failure path,
      // and its own errors are swallowed so a Laravel-side rejection can't
      // surface as a submission failure for the visitor.
      submitToLaravelEnquiryForm(normalized).catch((err) => {
        console.error("[enquiry-form] Laravel forward failed", err);
      });
      setSubmitted(true);
      setForm(initialState);
      setErrors({});
    } catch {
      // submitMutation.isError renders the failure message below the button
    }
  };

  return (
    <div className="d-flex position-relative justify-content-center px-3 pt-3">
      {/* This app is built on Tailwind, not Bootstrap — loading Bootstrap's
          CSS here (scoped to this route by Next.js's App Router head
          management) is what actually makes the form-control/d-flex/mb-3
          classes below render like Laravel's version, instead of being
          inert class names with no matching styles. */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      {submitted ? (
        <div className="w-100" style={{ maxWidth: 520 }}>
          <div
            className="d-flex align-items-center justify-content-between"
            style={{
              background: "#d1e7dd",
              color: "#0f5132",
              border: "1px solid #badbcc",
              borderRadius: 4,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <div>
              <strong>&#10003;</strong> &nbsp;Thank you for your enquiry. A member of the team
              will be in contact soon.
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSubmitted(false)}
              style={{ background: "none", border: "none", fontSize: 18, lineHeight: 1, cursor: "pointer" }}
            >
              &times;
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-100 pt-3"
          // Exact match to Laravel's own .contact-form rule
          // (usrmusic_rep/resources/scss/pages/contact-us.scss) — that's the
          // only real customization on top of plain Bootstrap defaults there,
          // no separate font-family override exists anywhere in that build.
          style={{ maxWidth: 520, color: "#8b8884", fontSize: 12 }}
        >
          <label>
            You can also contact us by filling the below form and a member of the team will
            contact you:
          </label>

          <div className="mb-3 mt-3">
            <label className="form-label d-block">Name: *</label>
            <input
              type="text"
              className={inputClass(!!errors.name)}
              value={form.name}
              onChange={update("name")}
              onBlur={handleBlur("name")}
            />
            {errors.name ? (
              <span className="text-danger d-block mt-1" style={{ fontSize: 13 }}>{errors.name}</span>
            ) : (
              <span className="text-muted d-block mt-1" style={{ fontSize: 12 }}>Letters and spaces only.</span>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Email Address: *</label>
            <input
              type="email"
              className={inputClass(!!errors.email)}
              value={form.email}
              onChange={update("email")}
              onBlur={handleBlur("email")}
            />
            {errors.email ? <span className="text-danger d-block mt-1" style={{ fontSize: 13 }}>{errors.email}</span> : null}
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Contact Number: *</label>
            <input
              type="text"
              className={inputClass(!!errors.contact_number)}
              value={form.contact_number}
              onChange={update("contact_number")}
              onBlur={handleBlur("contact_number")}
            />
            {errors.contact_number ? (
              <span className="text-danger d-block mt-1" style={{ fontSize: 13 }}>{errors.contact_number}</span>
            ) : (
              <span className="text-muted d-block mt-1" style={{ fontSize: 12 }}>11 to 15 digits, no spaces needed.</span>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Event Date: *</label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              className={inputClass(!!errors.event_date)}
              value={form.event_date}
              onChange={update("event_date")}
              onBlur={handleBlur("event_date")}
            />
            {errors.event_date ? (
              <span className="text-danger d-block mt-1" style={{ fontSize: 13 }}>{errors.event_date}</span>
            ) : null}
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Type of Event:</label>
            <select className={inputClass(false)} value={form.event_type} onChange={update("event_type")}>
              <option value="">Select…</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Venue:</label>
            <input type="text" className={inputClass(false)} value={form.venue} onChange={update("venue")} />
          </div>

          <div className="mb-3">
            <label className="form-label d-block">
              Tell us more ( Timings and Requirements with Package ) *
            </label>
            <textarea
              className={inputClass(!!errors.event_details)}
              rows={4}
              value={form.event_details}
              onChange={update("event_details")}
              onBlur={handleBlur("event_details")}
            />
            {errors.event_details ? (
              <span className="text-danger d-block mt-1" style={{ fontSize: 13 }}>{errors.event_details}</span>
            ) : null}
          </div>

          {/* Honeypot: visually hidden from real visitors, never focusable.
              A bot that fills every input will populate this; the backend
              silently no-ops when it's non-empty. */}
          <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }} aria-hidden="true">
            <label htmlFor="company_website">Leave this field blank</label>
            <input
              id="company_website"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.company_website}
              onChange={update("company_website")}
            />
          </div>

          {submitMutation.isError ? (
            <p className="text-danger" style={{ fontSize: 13 }}>
              {getSubmitErrorMessage(submitMutation.error)}
            </p>
          ) : null}

          <div className="mb-3">
            <button type="submit" disabled={submitMutation.isPending} className="submit-btn">
              {submitMutation.isPending ? "SUBMITTING..." : "SUBMIT"}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .submit-btn {
          margin-top: 0.75rem;
          padding: 0.5rem 3rem;
          border: 1px solid #212529;
          background: transparent;
          color: #212529;
          border-radius: 0;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
        }
        .submit-btn:hover:not(:disabled) {
          background: #212529;
          color: #fff;
        }
        .submit-btn:disabled {
          opacity: 0.65;
          cursor: default;
        }
      `}</style>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `form-control ${hasError ? "is-invalid" : ""}`;
}

// The Node endpoint returns a specific, useful reason for its 400s (e.g.
// "This email is already attached with Dj") — show that instead of a
// generic fallback so a visitor who hits a real, actionable rejection knows
// what to do next (e.g. use a different email).
function getSubmitErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { error?: string; message?: string } } } | undefined;
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    "Something went wrong submitting your enquiry. Please try again."
  );
}
