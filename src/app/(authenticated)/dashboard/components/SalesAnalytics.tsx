"use client";
import dynamic from "next/dynamic";
import { Spin, Skeleton } from "antd";
import { useEffect, useRef, useState, useMemo } from "react";
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
  // ApexCharts renders a fixed-size SVG via width/height props, so it can't
  // shrink/grow through CSS alone the way the rest of the card does. A fixed
  // per-breakpoint size (e.g. "80px below 2xl, 160px at 2xl+") tracks the
  // *viewport* width, not the card itself — on mobile the card goes full
  // width but stays short, and the chart looked stuck tiny/undersized
  // relative to the space it actually had. Measuring the wrapper box with
  // ResizeObserver instead ties the chart to whatever size CSS actually
  // gave its container (driven by the card's own height — see the
  // `aspect-square h-full` wrapper below), on any screen size.
  const donutWrapRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState(80);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMounted((prev) => (prev === true ? prev : true));
    });
  }, []);

  useEffect(() => {
    const el = donutWrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      // Round to the nearest 4px so a slow drag-resize doesn't force an
      // ApexChart remount (driven by chartSize in its `key`) on every pixel.
      const size = Math.round(Math.min(rect.width, rect.height) / 4) * 4;
      if (size > 0) {
        setChartSize((prev) => (Math.abs(prev - size) >= 4 ? size : prev));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
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
    <Card variant="white" className="shadow-sm p-4 flex flex-col h-full">
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

      <div className="flex flex-1 items-center gap-1.5 mt-2 min-w-0">
        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
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
            <ul className="text-sm space-y-2 min-w-0">
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
                  <li key={d.name} className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        colors[i] || "bg-gray-300"
                      } block`}
                    />
                    {/* Original stacked layout (name above, stat below) —
                        just pinned to one line each. `truncate` (not bare
                        `whitespace-nowrap`) so a long DJ name or stat that
                        doesn't fit ellipsizes inside its own column instead
                        of overflowing and getting painted over by the donut
                        chart next to it. */}
                    <div className="flex gap-0.5 flex-col items-start min-w-0 w-full">
                      <span className="text-gray-700 truncate max-w-full">
                        {d.name}
                      </span>
                      <span className="text-gray-500 truncate max-w-full">
                        {pct}% · {d.count} events
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* `aspect-square h-full`: width tracks whatever height the row
            gives this box (which itself comes from the card's own height),
            instead of a fixed per-breakpoint size — so on a wide-but-short
            mobile card the chart grows with the card instead of being stuck
            at a small viewport-driven size.

            `max-w-[38%]` is the other half of that: flexbox only shrinks a
            sibling when the row actually overflows, and with the text
            column allowed to shrink to 0 (`min-w-0` + `truncate`) it never
            does — so on a tall-but-narrow card (e.g. 1280px) the
            height-driven size alone claimed too much width and ellipsized
            the DJ stats. Capping width to a fraction of the row directly,
            rather than relying on flex-shrink, is what actually keeps this
            from crowding the text at any card height. */}
        <div
          ref={donutWrapRef}
          className="relative shrink-0 flex items-center justify-center aspect-square h-full max-h-40 min-h-16 max-w-[38%]"
        >
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
                <div className="w-full h-full flex items-center justify-center">
                  <Spin size="large" />
                </div>
              );
            }

            return isMounted ? (
              <ApexChart
                key={`donut-${year}-${chartSize}-${labels.join("-")}-${series.join("-")}`}
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
                      /* ApexCharts' own center label (name + value + total,
                         stacked as up to 3 lines) computes its vertical
                         center assuming all configured lines are present,
                         so a hidden `name` line still throws the visible
                         total off-center. Turning the built-in label off
                         entirely and overlaying our own absolutely-centered
                         number below sidesteps that for good. */
                      donut: {
                        size: "65%",
                        labels: { show: false },
                      },
                    },
                  },
                  stroke: { show: true, width: 6, lineCap: "round" },
                }}
                series={hasData ? series : [1]}
                type="donut"
                width={chartSize}
                height={chartSize}
              />
            ) : (
              <div style={{ width: chartSize, height: chartSize }} />
            );
          })()}
          {!isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Sized off the same measured `chartSize` as the chart itself
                  (~22% of the ring's diameter) so the number scales with the
                  donut instead of jumping at fixed viewport breakpoints. */}
              <span
                className="font-semibold text-gray-900"
                style={{ fontSize: Math.max(12, Math.round(chartSize * 0.22)) }}
              >
                {totalDjCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
