"use client";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import Card from "@/src/components/Card";
import { Spin } from "antd";

type StatKey = "profitStat" | "turnOverStat";

interface ShowStatType {
  profitStat: boolean;
  turnOverStat: boolean;
}

interface StatCardsRowProps {
  totalEvents: number;
  pendingPayments: number;
  totalTurnover: number;
  totalProfit: number;
  isLoading?: boolean;
  onStatToggle?: (stat: StatKey, value: boolean) => void;
  showStat?: ShowStatType;
}

/* Icon sizing.

   The source SVGs all have different intrinsic boxes:
     stat-icon 32x22 | red-chart 60x41 | Line-chart 80x55 | list-icon 30x30 | Icon 46x46
   Passing those raw numbers to next/image made every card a different size, and
   forcing them all to one width/height distorted the artwork instead.

   So each icon gets a FIXED box (w-16 h-11 sparklines, size-10 badges) plus
   `object-contain`: the footprint is identical across all four cards while the
   artwork scales inside it, never stretched. `shrink-0` keeps flex from
   crushing them when a card gets narrow at high zoom. */
const SPARKLINE = { width: 64, height: 44 } as const;
const SPARKLINE_CLASS = "shrink-0 w-16 h-11 object-contain";

const BADGE = { width: 40, height: 40 } as const;
const BADGE_CLASS = "shrink-0 size-10 object-contain";

export default function StatCardsRow({
  totalEvents,
  pendingPayments,
  totalTurnover,
  totalProfit,
  isLoading = false,
  onStatToggle,
  showStat = {
    profitStat: false,
    turnOverStat: false,
  },
}: StatCardsRowProps) {
  const handleToggle = (stat: StatKey) => {
    onStatToggle?.(stat, !showStat[stat]);
  };

  return (
    <div className="flex gap-6">
      {/* Events total */}
      <Card
        variant="white"
        className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
      >
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="mt-4 flex-1 min-w-0">
              <p className="text-base text-primary">Events</p>
              <div>
                <p className="text-2xl font-semibold">{totalEvents}</p>
              </div>
            </div>
            <Image
              src={"/svgs/stat-icon.svg"}
              alt=""
              aria-hidden
              {...SPARKLINE}
              className={SPARKLINE_CLASS}
            />
          </>
        )}
      </Card>

      {/* Remaining */}
      <Card
        variant="white"
        className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
      >
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Image
              src={"/svgs/list-icon.svg"}
              alt=""
              aria-hidden
              {...BADGE}
              className={BADGE_CLASS}
            />
            <div className="mt-4 flex-1 min-w-0">
              <p className="text-base text-primary">Remaining</p>
              <p className="text-2xl font-semibold">{pendingPayments}</p>
            </div>
            <Image
              src={"/svgs/red-chart.svg"}
              alt=""
              aria-hidden
              {...SPARKLINE}
              className={SPARKLINE_CLASS}
            />
          </>
        )}
      </Card>

      {/* Turn Over */}
      <Card
        variant="white"
        className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        onClick={isLoading ? undefined : () => handleToggle("turnOverStat")}
      >
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Image
              src={"/svgs/Icon.svg"}
              alt=""
              aria-hidden
              {...BADGE}
              className={BADGE_CLASS}
            />
            <div className="mt-4 flex-1 min-w-0">
              <p className="text-base text-primary">Turn Over</p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-2xl font-semibold truncate ${
                    !showStat.turnOverStat ? "blur-sm" : ""
                  }`}
                >
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    maximumFractionDigits: 0,
                  }).format(totalTurnover)}
                </p>
                {showStat.turnOverStat ? (
                  <EyeOff size={20} className="shrink-0" />
                ) : (
                  <Eye size={20} className="shrink-0" />
                )}
              </div>
            </div>
            <Image
              src={"/svgs/red-chart.svg"}
              alt=""
              aria-hidden
              {...SPARKLINE}
              className={SPARKLINE_CLASS}
            />
          </>
        )}
      </Card>

      {/* Profit */}
      <Card
        variant="green"
        className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
        onClick={isLoading ? undefined : () => handleToggle("profitStat")}
      >
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-base text-white/80 mb-2">Profit</p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-2xl font-semibold text-white truncate ${
                    !showStat.profitStat ? "blur-sm" : ""
                  }`}
                >
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    maximumFractionDigits: 0,
                  }).format(totalProfit)}
                </p>
                {showStat.profitStat ? (
                  <EyeOff size={20} color="#fff" className="shrink-0" />
                ) : (
                  <Eye size={20} color="#fff" className="shrink-0" />
                )}
              </div>
            </div>
            <Image
              src={"/svgs/Line-chart.svg"}
              alt=""
              aria-hidden
              {...SPARKLINE}
              className={SPARKLINE_CLASS}
            />
          </>
        )}
      </Card>
    </div>
  );
}
