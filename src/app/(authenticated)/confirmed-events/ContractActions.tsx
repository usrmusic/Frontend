"use client";

import { useState } from "react";
import { notification } from "antd";
import {
  useEnsureContractToken,
  useSendContractEmail,
} from "@/src/api/contracts";

type Props = {
  eventId: number | string | null | undefined;
  contractToken?: string | null;
  contractSignedAt?: string | null;
  contractPdfUrl?: string | null;
};

// Admin panel that lives at the top of the Contracts tab. Lets the operator
// generate / regenerate the public signing link and email it to the client.
// Once signed, switches to a "view signed PDF" state instead.
export default function ContractActions({
  eventId,
  contractToken,
  contractSignedAt,
  contractPdfUrl,
}: Props) {
  const ensure = useEnsureContractToken();
  const send = useSendContractEmail();
  const [token, setToken] = useState<string | null>(contractToken || null);

  if (!eventId) return null;

  const isSigned = !!contractSignedAt;
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const signingUrl = token ? `${baseUrl}/contract/${token}` : null;

  const handleEnsureToken = async () => {
    try {
      const res = await ensure.mutateAsync(eventId);
      setToken(res.contract_token);
      notification.success({ message: "Signing link ready" });
    } catch {
      notification.error({ message: "Could not generate signing link" });
    }
  };

  const handleSendEmail = async () => {
    try {
      const res = await send.mutateAsync(eventId);
      if (res.signing_url) setToken(extractToken(res.signing_url));
      notification.success({ message: "Signing link emailed to client" });
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      notification.error({
        message: err?.response?.data?.error || "Could not send email",
      });
    }
  };

  const copy = async () => {
    if (!signingUrl) return;
    try {
      await navigator.clipboard.writeText(signingUrl);
      notification.success({ message: "Copied" });
    } catch {
      notification.error({ message: "Copy failed" });
    }
  };

  return (
    <div className="border border-gray-200 rounded-md bg-white p-4 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">Contract signing</h3>
          <p className="text-xs text-gray-500">
            {isSigned
              ? "This contract has been signed by the client."
              : "Generate a secure link the client can use to sign this contract online."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSigned && contractPdfUrl ? (
            <a
              href={contractPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 text-xs rounded bg-black text-white hover:bg-gray-800"
            >
              View signed PDF
            </a>
          ) : null}
          {!isSigned ? (
            <>
              <button
                type="button"
                disabled={ensure.isPending}
                onClick={handleEnsureToken}
                className="px-3 py-2 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-60"
              >
                {ensure.isPending
                  ? "Working…"
                  : token
                    ? "Regenerate link"
                    : "Generate signing link"}
              </button>
              <button
                type="button"
                disabled={send.isPending}
                onClick={handleSendEmail}
                className="px-3 py-2 text-xs rounded bg-black text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {send.isPending ? "Sending…" : "Email link to client"}
              </button>
            </>
          ) : null}
        </div>
      </div>
      {signingUrl && !isSigned ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <input
            value={signingUrl}
            readOnly
            className="flex-1 border border-gray-200 rounded px-2 py-1 bg-gray-50"
          />
          <button
            type="button"
            onClick={copy}
            className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
          >
            Copy
          </button>
        </div>
      ) : null}
    </div>
  );
}

function extractToken(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}
