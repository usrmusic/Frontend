"use client";
import dynamic from "next/dynamic";
import { Spin, Skeleton } from "antd";
import { useEffect, useState, useMemo } from "react";
import Card from "@/src/components/Card";
import type { ComponentType } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const ApexChart: ComponentType<Record<string, unknown>> =
  ReactApexChart as unknown as ComponentType<Record<string, unknown>>;

interface SalesAnalyticsProps {
  djCounts?: Record<string, number>;
  confirmedEventsCount?: number;
  totalEvents?: number;
  isLoading?: boolean;
  year?: number;
}

export default function SalesAnalytics({
  djCounts = {},
  confirmedEventsCount = 0,
  totalEvents = 0,
  isLoading = false,
  year = new Date().getFullYear(),
}: SalesAnalyticsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMounted((prev) => (prev === true ? prev : true));
    });
  }, []);

  const djEntries = useMemo(() => {
    return Object.entries(djCounts)
      .map(([name, count]) => ({ name, count: Number(count ?? 0) }))
      .filter((d) => d.name && !Number.isNaN(d.count))
      .sort((a, b) => b.count - a.count);
  }, [djCounts]);

  const totalDjCount = useMemo(
    () => djEntries.reduce((s, d) => s + d.count, 0),
    [djEntries]
  );

  const topDjs = djEntries.slice(0, 3);

  const completedPercent = totalEvents
    ? Math.round((confirmedEventsCount / Math.max(1, totalEvents)) * 100)
    : 0;

  return (
    <Card variant="white" className="shadow-sm p-5 flex flex-col h-full">
      <div className="mb-2 gap-2 flex flex-col">
        <h4 className="font-poppins text-base font-semibold text-gray-900 flex items-center min-h-8">
          Sales Analytics
        </h4>
        <p className="text-sm text-gray-400">Events Progress</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-gray-900">
            {isLoading ? "..." : confirmedEventsCount}
          </span>
          <span className="text-sm text-gray-400">
            /{isLoading ? "..." : totalEvents}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {completedPercent}% Events Completed
        </p>
      </div>

      <div className="flex flex-1 items-center gap-2 mt-2 justify-between">
        <div className="flex-1 flex flex-col justify-center h-full">
          {isLoading ? (
            <div className="h-20 flex items-center">
              <Skeleton
                active
                title={false}
                paragraph={{ rows: 3, width: [120, 90, 80] }}
              />
            </div>
          ) : !djEntries.length ? (
            <div className="text-sm text-gray-500">
              No sales analytics data available.
            </div>
          ) : (
            <ul className="text-sm space-y-4">
              {topDjs.map((d, i) => {
                const pct = totalDjCount
                  ? Math.round((d.count / totalDjCount) * 100)
                  : 0;
                const colors = [
                  "bg-red-400",
                  "bg-blue-400",
                  "bg-emerald-500",
                ];
                return (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        colors[i] || "bg-gray-300"
                      } block`}
                    />
                    <div className="flex gap-2 flex-col items-start">
                      <span className="text-gray-700">{d.name}</span>
                      <span className="text-gray-500">
                        {pct}% · {d.count} events
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 flex-1 flex items-center justify-center">
          {(() => {
            const top = djEntries.slice(0, 3);
            const topSum = top.reduce((s, d) => s + d.count, 0);
            const other = Math.max(0, totalDjCount - topSum);
            const labels = top
              .map((d) => d.name)
              .concat(other > 0 ? ["Other"] : []);
            const series = top
              .map((d) => d.count)
              .concat(other > 0 ? [other] : []);
            const colors = ["#7A9683", "#98B79A", "#BFE0C7", "#E6EFE7"];
            const hasData = series.some((v) => v > 0);

            if (isLoading) {
              return (
                <div
                  style={{ width: 160, height: 160 }}
                  className="flex items-center justify-center"
                >
                  <Spin size="large" />
                </div>
              );
            }

            return isMounted ? (
              <ApexChart
                key={`donut-${year}-${labels.join("-")}-${series.join("-")}`}
                options={{
                  chart: {
                    animations: {
                      enabled: true,
                      easing: "easeinout",
                      speed: 600,
                    },
                    toolbar: { show: false },
                  },
                  labels,
                  colors: colors.slice(0, labels.length),
                  legend: { show: false },
                  dataLabels: { enabled: false },
                  tooltip: { enabled: true },
                  plotOptions: {
                    pie: {
                      donut: {
                        size: "65%",
                        labels: {
                          show: true,
                          name: { show: false },
                          value: {
                            show: true,
                            formatter: (val: unknown) => String(val),
                          },
                          total: {
                            show: true,
                            label: "Total",
                            formatter: () => `${totalDjCount}`,
                          },
                        },
                      },
                    },
                  },
                  stroke: { show: true, width: 6, lineCap: "round" },
                }}
                series={hasData ? series : [1]}
                type="donut"
                width={160}
                height={160}
              />
            ) : (
              <div style={{ width: 160, height: 160 }} />
            );
          })()}
        </div>
      </div>
    </Card>
  );
}
