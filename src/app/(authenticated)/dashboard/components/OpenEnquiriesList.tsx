"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Skeleton } from "antd";
import Card from "@/src/components/Card";
import { colorPrimaryGradient } from "@/src/config/ThemeConfig";

type OpenEnquiry = {
  id?: number | string;
  couple_name?: string | null;
  date?: string | null;
  client?: { name?: string | null } | null;
  venue?: string | null;
  venues?: { venue?: string | null } | null;
  subtitle?: string | null;
  created_at?: string | null;
  tag?: string | null;
  users_events_dj_idTousers?: { id?: number; name?: string | null } | null;
  users_events_user_idTousers?: { id?: number; name?: string | null } | null;
  [key: string]: unknown;
};

const formatDate = (v?: string | number | Date | null) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v as string | number);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }
  if (v instanceof Date) {
    return Number.isNaN(v.getTime())
      ? ""
      : v.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }
  return "";
};

interface OpenEnquiriesListProps {
  enquiries?: OpenEnquiry[];
  count?: number;
  isLoading?: boolean;
  scope?: "admin" | "team" | "personal";
  upcomingIds?: number[];
}

export default function OpenEnquiriesList({
  enquiries,
  count,
  isLoading,
  scope = 'team',
  upcomingIds = [],
}: OpenEnquiriesListProps) {
  const router = useRouter();

  const handleEnquiryClick = (enq: OpenEnquiry) => {
    try {
      const clientName =
        enq.users_events_user_idTousers?.name ?? enq.client?.name ?? enq.couple_name ?? "";
      const eventId = enq.id ?? "";
      router.push(
        `/open-enquiry?search=${encodeURIComponent(String(eventId))}&name=${encodeURIComponent(String(clientName))}&select=${encodeURIComponent(String(eventId))}`,
      );
    } catch (e) {
      console.error(e);
    }
  };

  // If team scope, exclude events that appear in upcomingIds
  const filteredEnquiries = (enquiries || []).filter((e) => {
    if (scope === 'team' && Array.isArray(upcomingIds) && upcomingIds.length) {
      const id = typeof e.id === 'number' ? e.id : Number(e.id);
      if (id && upcomingIds.includes(id)) return false;
    }
    return true;
  });

  const visibleCount = filteredEnquiries.length;

  return (
    <Card
      variant="white"
      /* Calendar needs more room than Open Enquiry specifically in the
         lg → 2xl band (~1024–1535px) — that's where 7 date columns get
         cramped enough to overlap. At 2xl+ there's plenty of width either
         way, so it reverts to the original, slightly wider Open Enquiry
         proportions. */
      className="col-span-12 lg:col-span-4 2xl:col-span-5 shadow-sm p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">
          Open Enquiry (
            {isLoading ? (
              "..."
            ) : (
              // For personal scope we do not allow redirecting to open enquiries
              scope === 'personal' ? (
                <span className="text-primary font-semibold">{visibleCount}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/open-enquiry")}
                  className="text-primary underline font-semibold"
                >
                  {visibleCount}
                </button>
              )
            )}
          )
        </p>
      </div>
      {isLoading ? (
        <div className="h-44 flex items-center justify-center">
          <Skeleton active />
        </div>
          ) : !filteredEnquiries?.length ? (
        <div className="text-sm text-gray-500">No open enquiries.</div>
      ) : (
        <ul className="space-y-2 no-scrollbar text-sm max-h-[260px] overflow-auto">
          {filteredEnquiries.map((enq: OpenEnquiry, idx: number) => {
            const clientName =
              enq.users_events_user_idTousers?.name ??
              enq.client?.name ??
              enq.couple_name ??
              "Unknown";
            const venueName =
              enq.venues?.venue ??
              enq.venue ??
              enq.subtitle ??
              "Unknown Venue";
            const badgeText = enq.date
              ? formatDate(enq.date)
              : (enq.tag ?? "New");

            return (
              <li
                key={String(enq.id ?? enq.couple_name ?? `enq-${idx}`)}
                className={`flex items-center border-b border-[#636363] last:border-0 justify-between px-3 py-3 ${scope === 'personal' ? '' : 'cursor-pointer hover:bg-gray-50'} transition-colors`}
                title={scope === 'personal' ? undefined : "Double-click to open"}
                onDoubleClick={() => { if (scope !== 'personal') handleEnquiryClick(enq); }}
              >
                <div className="flex gap-3">
                  <Image
                    src={"/images/avatar.png"}
                    alt="avatar"
                    width={30}
                    height={30}
                    className="rounded-lg"
                  />
                  <div>
                    <p className="text-sm text-gray-900">{clientName}</p>
                    <p className="text-xs text-gray-400">{venueName}</p>
                  </div>
                </div>
                <div
                  className="rounded-sm px-2 text-center py-1 text-xs font-medium text-white min-w-[84px] whitespace-nowrap"
                  style={{ background: colorPrimaryGradient }}
                >
                  {badgeText}
                </div>
              </li>
            );
              })}
        </ul>
      )}
    </Card>
  );
}
