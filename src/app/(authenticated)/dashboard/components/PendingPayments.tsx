"use client";
import Card from "@/src/components/Card";
import { Skeleton } from "antd";
import { useRouter } from "next/navigation";

export interface PendingPayment {
  id: number;
  client_name?: string | null;
  couple_name?: string | null;
  event_status_id?: number;
  date?: string | null;
  outstanding?: number | null;
}

interface PendingPaymentsProps {
  payments?: PendingPayment[];
  isLoading?: boolean;
  scope?: "admin" | "team" | "personal";
}

export default function PendingPayments({
  payments = [],
  isLoading = false,
  scope = 'admin',
}: PendingPaymentsProps) {
  const router = useRouter();

  const handlePaymentClick = (payment: PendingPayment) => {
    try {
      const clientName =
        payment.client_name ?? payment.couple_name ?? `Client #${payment.id}`;
      const eventId = payment.id;
      const status = Number(payment.event_status_id);
      let target = "/dashboard";
      if (scope === 'personal') {
        // clients can only be redirected to confirmed events (status 2)
        if (status === 2) {
          target = "/confirmed-events";
          router.push(
            `${target}?search=${encodeURIComponent(String(eventId))}&name=${encodeURIComponent(String(clientName))}`,
          );
        }
        return;
      }
      if (status === 1) target = "/open-enquiry";
      else if (status === 2) target = "/confirmed-events";
      else if (status === 3 || status === 4) target = "/completed-events";
      router.push(
        `${target}?search=${encodeURIComponent(String(eventId))}&name=${encodeURIComponent(String(clientName))}`,
      );
    } catch (e) {
      console.error("Navigation error:", e);
    }
  };

  return (
    <Card variant="white" className="p-4 flex flex-col h-full">
      <div className="flex flex-col flex-1 justify-start h-full">
        <h4 className="mb-3 text-base font-semibold text-gray-900 flex items-center min-h-8">Pending Payment</h4>
        {isLoading ? (
          <div className="w-full pt-3 flex items-center justify-center">
            <Skeleton active />
          </div>
        ) : !payments?.length ? (
          <div className="text-sm text-gray-500">
            No pending payments.
          </div>
        ) : (
          <ul className="space-y-2 no-scrollbar text-sm flex-1 max-h-[260px] overflow-auto">
            {payments.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between py-2 border-b border-[#636363] ${scope === 'personal' ? '' : 'cursor-pointer hover:bg-gray-50'} transition-colors`}
                title={scope === 'personal' ? undefined : 'Click to search'}
                onClick={() => { if (scope !== 'personal') handlePaymentClick(p); }}
              >
                <div>
                  <p className="text-sm text-gray-900">{p.client_name ?? `Client #${p.id}`}</p>
                  <p className="text-xs text-gray-400">
                    {p.date
                      ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : "No date"}{" "}
                    · {p.outstanding ? `£${p.outstanding}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500">
                  Pending
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
