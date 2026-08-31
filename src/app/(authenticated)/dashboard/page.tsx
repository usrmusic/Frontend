"use client";
import { useState, useEffect } from "react";
import Card from "@/src/components/Card";
import CalendarWithSidebar from "./components/CalendarWithSidebar";
import { useDashboard, useUpcomingEvents } from "@/src/api/dasboard";
import { useDebounce } from "@/src/hooks/useDebounce";
import OpenEnquiriesList from "./components/OpenEnquiriesList";
import EventActivity from "./components/EventActivity";
import StatCardsRow from "./components/StatCardsRow";
import EventOverview from "./components/EventOverview";
import SalesAnalytics from "./components/SalesAnalytics";
import PendingPayments from "./components/PendingPayments";
import DashboardTodos from "./components/DashboardTodos";
import ClientFilesCard from "./components/ClientFilesCard";
import { useRole } from "@/src/hooks/useRole";

const DashboardPage = () => {
  const { isClient } = useRole();
  const [showStat, setShowStat] = useState({
    profitStat: false,
    turnOverStat: false,
  });

  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  useEffect(() => {
    const handler: EventListener = (ev) => {
      const custom = ev as CustomEvent<{ year?: number }>;
      const y = custom?.detail?.year;
      if (typeof y === "number" && !Number.isNaN(y)) setYear(y);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("dashboard:yearChange", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dashboard:yearChange", handler);
      }
    };
  }, []);

  const { data: dashboard, isLoading: dashboardLoading } = useDashboard({
    year,
  });

  // Upcoming events search + data
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const debouncedUpcoming = useDebounce(upcomingSearch, 500);
  const { data: upcomingData, isLoading: upcomingLoading } = useUpcomingEvents(
    debouncedUpcoming.trim().length > 0 ? { search: debouncedUpcoming.trim() } : {}
  );

  // Client has no role-relevant activity feed; Staff/Admin still see it
  // (scoped to their own events by the backend).
  const eventActivityVisible = dashboard?.scope !== "personal";

  const handleStatToggle = (
    stat: keyof typeof showStat,
    value: boolean
  ) => {
    setShowStat((prev) => ({ ...prev, [stat]: value }));
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Stat Cards Row */}
      <StatCardsRow
        totalEvents={dashboard?.totalEvents ?? 0}
        // "Remaining" mirrors Laravel's confirmEnquiryEvents — the count of
        // confirmed-but-not-yet-completed events, NOT the pending-payments
        // list (a separate widget). Wiring this to pendingPayments.length
        // was showing an entirely different number than the legacy CRM.
        pendingPayments={dashboard?.confirmedEventsCount ?? 0}
        // show money only to admin
        totalTurnover={dashboard?.scope === 'admin' ? dashboard?.totalTurnover ?? 0 : 0}
        totalProfit={dashboard?.scope === 'admin' ? dashboard?.totalProfit ?? 0 : 0}
        showFinancialCards={dashboard?.scope === 'admin'}
        isLoading={dashboardLoading}
        onStatToggle={handleStatToggle}
        showStat={showStat}
      />

      {/* Top grid: Event Overview + right side stats */}
      <div className="grid grid-cols-12 gap-4 items-stretch h-full min-h-0 xl:min-h-[260px]">
        {/* Event Overview */}
        <EventOverview
          events={upcomingData || []}
          isLoading={dashboardLoading || upcomingLoading}
          onSearch={setUpcomingSearch}
          searchValue={upcomingSearch}
        />

        {/* Right column stats */}
        <section className="col-span-12 xl:col-span-6 flex flex-col gap-4 h-full">
          {/* Sales Analytics only renders for admin scope — everyone else
              only ever gets Pending Payments (or nothing), so the 2-column
              split is admin-only too; otherwise Pending Payments is left at
              half width next to a permanently empty column. Team scope gets
              neither, so this block is skipped entirely rather than left
              rendering an empty, gap-eating div above Todos. */}
          {(dashboardLoading || dashboard?.scope === 'admin' || (dashboard?.scope === 'personal' && !isClient)) && (
            <div className={`grid grid-cols-1 ${dashboardLoading || dashboard?.scope === 'admin' ? 'xl:grid-cols-2' : ''} gap-4 items-stretch h-full`}>
              {/* Sales Analytics (admin only — show skeleton while loading) */}
              {(dashboardLoading || dashboard?.scope === 'admin') && (
                <SalesAnalytics
                  djCounts={
                    Object.fromEntries(
                      Object.entries(dashboard?.salesAnalytics?.djCounts ?? {}).map(
                        ([key, val]) => [key, Number(val ?? 0)]
                      )
                    )
                  }
                  confirmedEventsCount={dashboard?.confirmedEventsCount ?? 0}
                  totalEvents={dashboard?.totalEvents ?? 0}
                  isLoading={dashboardLoading}
                  year={year}
                />
              )}

              {/* Pending Payments (admin + personal, but Client gets My Files
                  below instead — show skeleton while loading) */}
              {(dashboardLoading || dashboard?.scope === 'admin' || (dashboard?.scope === 'personal' && !isClient)) && (
                <PendingPayments
                  payments={dashboard?.pendingPayments || []}
                  isLoading={dashboardLoading}
                  scope={dashboard?.scope}
                />
              )}
            </div>
          )}

          {/* Client's own uploaded event files, replacing Pending Payments'
              slot for that scope. */}
          {isClient && dashboard?.scope === 'personal' && <ClientFilesCard />}
          {/* Dashboard Todos for team scope — flex-1 so it fills the section
              (matching Event Overview's height) instead of leaving a gap
              where Sales Analytics/Pending Payments would have been. */}
          {dashboard?.scope === 'team' && (
            <div className="flex-1 flex flex-col">
              <DashboardTodos
                eventIds={(upcomingData || []).slice(0, 6).map((e) => Number(e.id)).filter(Boolean)}
              />
            </div>
          )}
        </section>
      </div>

      {/* Bottom grid: Open Enquiry + Calendar + Activities — Client sees none
          of these (Open Enquiry and Calendar are hidden for Client, and
          eventActivityVisible is already false for personal scope), so skip
          the whole row rather than render an empty grid gap. */}
      {!isClient && (
        <div className="grid grid-cols-12 gap-4 pb-4">
          {/* Open Enquiry Component */}
          <OpenEnquiriesList
            enquiries={dashboard?.openEnquiries}
            count={
              dashboard?.openEnquiriesCount ?? dashboard?.openEnquiries?.length
            }
            isLoading={dashboardLoading}
            scope={dashboard?.scope}
            upcomingIds={(upcomingData || []).map((e) => Number(e.id)).filter(Boolean)}
          />

          {/* Calendar — expands into Event Activity's space only when that
              widget is hidden (Client scope). Staff still see activity scoped
              to their own events, Admin sees all — only Client has no
              role-relevant activity to show. */}
          <Card
            variant="white"
            className={`dashboard-calendar col-span-12 ${eventActivityVisible ? "lg:col-span-5 2xl:col-span-4" : "lg:col-span-8 2xl:col-span-7"} shadow-sm p-0 rounded-2xl bg-[#F6F5F0]`}
          >
            <CalendarWithSidebar events={dashboard?.calendarEvents} isLoading={dashboardLoading} />
          </Card>

          {/* Event Activity — hidden for Client only; Staff/Admin see it
              (backend scopes the notes themselves per role). */}
          {eventActivityVisible && (
            <EventActivity
              notes={dashboard?.recentNotes}
              isLoading={dashboardLoading}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
