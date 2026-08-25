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

const DashboardPage = () => {
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
        // show pending payments only to admin and personal scopes
        pendingPayments={
          dashboard?.scope === 'admin' || dashboard?.scope === 'personal'
            ? dashboard?.pendingPayments?.length ?? 0
            : 0
        }
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch h-full">
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

            {/* Pending Payments (admin + personal — show skeleton while loading) */}
            {(dashboardLoading || dashboard?.scope === 'admin' || dashboard?.scope === 'personal') && (
              <PendingPayments
                payments={dashboard?.pendingPayments || []}
                isLoading={dashboardLoading}
                scope={dashboard?.scope}
              />
            )}
          </div>
          {/* Dashboard Todos for team scope */}
          {dashboard?.scope === 'team' && (
            <div className="col-span-1 xl:col-span-2">
              <DashboardTodos
                eventIds={(upcomingData || []).slice(0, 6).map((e) => Number(e.id)).filter(Boolean)}
              />
            </div>
          )}
        </section>
      </div>

      {/* Bottom grid: Open Enquiry + Calendar + Activities */}
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

        {/* Calendar */}
        <Card
          variant="white"
          className="dashboard-calendar col-span-12 lg:col-span-5 2xl:col-span-4 shadow-sm p-0 rounded-2xl bg-[#F6F5F0]"
        >
          <CalendarWithSidebar events={dashboard?.calendarEvents} isLoading={dashboardLoading} />
        </Card>

        {/* Event Activity Component (hide for team scope) */}
        {dashboard?.scope !== 'team' && (
          <EventActivity
            notes={dashboard?.recentNotes}
            isLoading={dashboardLoading}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
