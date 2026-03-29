"use client";
import Button from "@/src/components/Button";
import { BackButton } from "@/src/components/Icons";
import { Calendar, Tooltip, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useCalendar } from "@/src/api/calendar";

const CalendarPage = () => {
  const [value, setValue] = useState(() => dayjs());
  const [selectedValue, setSelectedValue] = useState(() => dayjs("2017-01-25"));

  const [year, setYear] = useState<number>(() => value.year());
  const { data: raw = undefined, isLoading } = useCalendar({ year });

  const events = useMemo(() => {
    if (!raw) return [] as any[];
    if (Array.isArray(raw)) return raw as any[];
    if (Array.isArray((raw as any).data)) return (raw as any).data as any[];
    if (Array.isArray((raw as any).calendarEvents)) return (raw as any).calendarEvents as any[];
    if (Array.isArray((raw as any).events)) return (raw as any).events as any[];
    return [] as any[];
  }, [raw]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    events.forEach((e: any) => {
      if (!e?.date) return;
      const key = dayjs(e.date).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  useEffect(() => {
    const handler = (ev: any) => {
      const y = ev?.detail?.year;
      if (typeof y === "number") setYear(y);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("dashboard:yearChange", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dashboard:yearChange", handler as EventListener);
      }
    };
  }, []);

  useEffect(() => {
    // when the year changes (from header), move calendar view to that year
    if (typeof year === "number") {
      setValue((v) => v.year(year));
      setSelectedValue((v) => v.year(year));
    }
  }, [year]);

  const onSelect = (newValue: Dayjs) => {
    setValue(newValue);
    setSelectedValue(newValue);
  };

  const onPanelChange = (newValue: Dayjs) => {
    setValue(newValue);
  };

  const dateCellRender = (current: Dayjs) => {
    const key = current.format("YYYY-MM-DD");
    const dayEvents = eventsByDate.get(key) || [];
    if (dayEvents.length === 0) return <div className="p-2">{current.date()}</div>;

    const tooltipContent = (
      <div className="space-y-1">
        {dayEvents.map((ev) => (
          <div key={ev.id} className="py-1">
            <div className="font-semibold">{ev.users_events_user_idTousers?.name}</div>
            <div className="text-sm text-[#4A5565]">{ev.venues?.venue}</div>
          </div>
        ))}
      </div>
    );

    return (
      <Tooltip title={tooltipContent} placement="top">
        <div className="p-2 rounded-md bg-yellow-50 h-full">
          <div>{current.date()}</div>
          <div className="flex mt-1 gap-1 items-center">
            {dayEvents.slice(0, 3).map((ev) => (
              <span key={ev.id} className="w-2 h-2 rounded-full bg-blue-500" />
            ))}
            {dayEvents.length > 3 && <span className="text-xs text-gray-500">+{dayEvents.length - 3}</span>}
          </div>
        </div>
      </Tooltip>
    );
  };

  const selectedKey = selectedValue.format("YYYY-MM-DD");
  const sidebarEvents = eventsByDate.get(selectedKey) || [];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="shrink-0">
          <BackButton />
        </Link>
        <h2 className="themeH1">Calendar</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl overflow-hidden p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spin />
            </div>
          ) : (
            <Calendar
              value={value}
              onSelect={onSelect}
              onPanelChange={onPanelChange}
              dateCellRender={dateCellRender}
              headerRender={({ value: headerValue, onChange: headerOnChange }) => {
                const month = headerValue.format("MMMM");
                const yearText = headerValue.format("YYYY");
                return (
                  <div className="flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => headerOnChange(headerValue.subtract(1, "month"))}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="Previous month"
                      >
                        <ChevronLeft />
                      </button>
                      <div className="font-medium">
                        {month} {yearText}
                      </div>
                      <button
                        onClick={() => headerOnChange(headerValue.add(1, "month"))}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="Next month"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                    <div />
                  </div>
                );
              }}
            />
          )}
        </div>
        <div className="bg-white col-span-1 rounded-xl overflow-hidden px-4 py-5">
          <div className="flex justify-between items-center">
            <p>Events</p>
            <Button icon={<Plus size={14} />} type="primary">
              Add Event
            </Button>
          </div>
          <div className="mt-6">
            <p className="text-sm">Events on {selectedValue.format('dddd, MMMM D, YYYY')}</p>
            <div className="mt-3">
              {sidebarEvents.length === 0 ? (
                <div className="text-sm text-[#4A5565] mt-3">No events for this date.</div>
              ) : (
                sidebarEvents.map((event: any) => (
                  <div key={event.id} className="rounded-3xl border border-black/10 p-5 mb-4 last:mb-0" style={{ boxShadow: "0px 4.23px 10.59px 0px #0000001A" }}>
                    <div className="flex gap-3">
                      <Image
                        src={event.users_events_user_idTousers?.profile_photo ? `/images/${event.users_events_user_idTousers.profile_photo}` : "/images/avatar.png"}
                        alt={event.users_events_user_idTousers?.name || 'avatar'}
                        width={40}
                        height={40}
                        className="rounded-full size-10"
                      />
                      <div className="flex-1">
                        <p className="text-base">{event.users_events_user_idTousers?.name}</p>
                        <p className="text-sm text-[#4A5565] mt-2">{event.venues?.venue}</p>
                        <hr />
                      </div>
                    </div>
                    <div className="flex mt-1.5 gap-1">
                      <MapPin size={14} color="#4A5565" className="shrink-0" />
                      <span className="text-sm text-[#4A5565]">{event.venues?.venue}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
