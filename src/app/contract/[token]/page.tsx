"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import dayjs from "dayjs";
import SignaturePad, {
  type SignaturePadHandle,
} from "@/src/components/common/SignaturePad";
import {
  useContractByToken,
  useSignContract,
} from "@/src/api/contracts";

// Public contract signing page — token-based access, no auth required.
// Mirrors the Laravel /contract/{token} flow (SignatureController@showContractForm
// + saveSignatureNew). Renders event details, lets the client draw a signature,
// posts it to the backend which generates the PDF and emails both parties.

export default function ContractSigningPage() {
  const params = useParams();
  const token = String(params?.token || "");

  const padRef = useRef<SignaturePadHandle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const { data, isLoading, isError, refetch } = useContractByToken(token);
  const signMutation = useSignContract(token);

  const event = data?.event;
  const company = data?.company;
  const alreadySigned = !!data?.already_signed;
  const signedPdfUrl = data?.signed_pdf_url || null;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-white rounded-md shadow p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Missing token</h1>
          <p className="text-sm text-gray-600">
            This signing link is missing a token. Please use the link from your
            email.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="text-sm text-gray-600">Loading contract…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-white rounded-md shadow p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Contract not found</h1>
          <p className="text-sm text-gray-600 mb-4">
            We could not find a contract for this link. It may have expired or
            been revoked.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!padRef.current || padRef.current.isEmpty()) {
      setError("Please draw your signature before submitting.");
      return;
    }
    const dataUri = padRef.current.toDataURL();
    if (!dataUri) {
      setError("Could not capture signature. Please try again.");
      return;
    }
    setSubmitting(true);
    try {
      await signMutation.mutateAsync(dataUri);
      // Success: refetch will surface already_signed=true and the signed PDF link.
      await refetch();
    } catch (e) {
      const err = e as { response?: { data?: { error?: string; message?: string } }; message?: string };
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to submit signature.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const userName = event.users_events_user_idTousers?.name || "Client";
  const venue = event.venues?.venue || "—";
  const eventDate = event.date
    ? dayjs(event.date).format("DD MMM YYYY")
    : "—";
  const total = event.total_cost_for_equipment ?? 0;
  const deposit = event.deposit_amount ?? 0;
  const companyName = company?.name || "USR Music";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-8 space-y-6">
        <header className="flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="text-xl font-semibold">{companyName}</h1>
            <p className="text-sm text-gray-600">Performance Contract</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            {event.invoice ? <div>Invoice #{event.invoice}</div> : null}
            <div>{dayjs().format("DD MMM YYYY")}</div>
          </div>
        </header>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Event details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Row label="Client" value={userName} />
            <Row label="Event date" value={eventDate} />
            <Row label="Venue" value={venue} />
            <Row label="Package price" value={`£${formatMoney(total)}`} />
            <Row label="Deposit" value={`£${formatMoney(deposit)}`} />
            <Row label="Event ID" value={`#${event.id}`} />
          </div>
        </section>

        {company?.bank_name || company?.account_number || company?.sort_code ? (
          <section>
            <p className="text-sm text-red-600">
              Please make payment to: Account Name: {company?.name || "—"}, Account No:{" "}
              {company?.account_number || "—"}, Sort Code: {company?.sort_code || "—"}
            </p>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Terms &amp; Conditions
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            By signing this contract you agree to the standard {companyName}{" "}
            performance terms: deposit is non-refundable, the balance is due no
            later than 14 days before the event date, and {companyName} will
            provide the equipment and services described above. Cancellations
            made less than 30 days before the event are subject to the full
            balance. Any changes to the event date, venue or package must be
            agreed in writing.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            {alreadySigned ? "Signed" : "Sign here"}
          </h2>

          {/* Company's own signature — shown alongside the client's, same as
              the old system's two-column signature block. */}
          <div className="mb-4 border rounded-md p-4 max-w-xs">
            <p className="text-xs text-gray-500 mb-2">
              Signed by {company?.contact_name || companyName}
              <br />
              for and on behalf of {companyName}
            </p>
            {company?.admin_signature_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.admin_signature_url}
                alt="Company signature"
                className="max-h-20 object-contain"
              />
            ) : (
              <p className="text-xs text-gray-400">No company signature on file</p>
            )}
          </div>

          {alreadySigned ? (
            <div className="border border-green-200 bg-green-50 rounded-md p-4 text-sm text-green-800">
              <p className="font-medium">
                This contract has already been signed.
              </p>
              {signedPdfUrl ? (
                <a
                  className="underline mt-2 inline-block"
                  href={signedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download signed PDF
                </a>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <SignaturePad
                  ref={(handle) => {
                    padRef.current = handle;
                  }}
                  width={600}
                  height={180}
                  onChange={(empty) => setIsEmpty(empty)}
                />
              </div>

              {error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100"
                  onClick={handleClear}
                  disabled={submitting}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="px-5 py-2 text-sm rounded bg-black text-white hover:bg-gray-800 disabled:opacity-60"
                  onClick={handleSubmit}
                  disabled={submitting || isEmpty}
                >
                  {submitting ? "Submitting…" : "Sign & save"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Signing as <strong>{userName}</strong> for and on behalf of the
                client.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function formatMoney(v: string | number | null | undefined) {
  if (v == null || v === "") return "0.00";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(2);
}
