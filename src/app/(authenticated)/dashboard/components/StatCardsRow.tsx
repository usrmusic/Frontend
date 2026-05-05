"use client";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import StatCard from "./StatCard";
import Card from "@/src/components/Card";
import { Spin } from "antd";

type StatKey = "eventStat" | "remainingStat" | "profitStat" | "turnOverStat";

interface ShowStatType {
  eventStat: boolean;
  remainingStat: boolean;
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

export default function StatCardsRow({
  totalEvents,
  pendingPayments,
  totalTurnover,
  totalProfit,
  isLoading = false,
  onStatToggle,
  showStat = {
    eventStat: false,
    remainingStat: false,
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
            <div className="mt-4 flex-1">
              <p className="text-base text-primary">Events</p>
              <div>
                <p
                  className={`text-2xl font-semibold ${
                    !showStat.eventStat ? "blur-sm" : ""
                  }`}
                >
                  {totalEvents}
                </p>
                <button
                  onClick={() => handleToggle("eventStat")}
                  aria-label="Toggle events visibility"
                >
                  {showStat.eventStat ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
            <Image
              src={"/svgs/stat-icon.svg"}
              alt="Events"
              width={20}
              height={20}
              className="flex-1"
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
              alt="Remaining"
              width={28}
              height={28}
              className="flex-1"
            />
            <div className="mt-4 flex-1">
              <p className="text-base text-primary">Remaining</p>
              <p
                className={`text-2xl font-semibold ${
                  !showStat.remainingStat ? "blur-sm" : ""
                }`}
              >
                {pendingPayments}
              </p>
              <button
                onClick={() => handleToggle("remainingStat")}
                aria-label="Toggle remaining visibility"
              >
                {showStat.remainingStat ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            <Image
              src={"/svgs/red-chart.svg"}
              alt="Remaining"
              width={28}
              height={28}
              className="flex-1"
            />
          </>
        )}
      </Card>

      {/* Turn Over */}
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
              src={"/svgs/Icon.svg"}
              alt="Turn Over"
              width={28}
              height={28}
              className="flex-1"
            />
            <div className="mt-4 flex-1">
              <p className="text-base text-primary">Turn Over</p>
              <p
                className={`text-2xl font-semibold ${
                  !showStat.turnOverStat ? "blur-sm" : ""
                }`}
              >
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                  maximumFractionDigits: 0,
                }).format(totalTurnover)}
              </p>
              <button
                onClick={() => handleToggle("turnOverStat")}
                aria-label="Toggle turn over visibility"
              >
                {showStat.turnOverStat ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            <Image
              src={"/svgs/red-chart.svg"}
              alt="Turn Over Chart"
              width={28}
              height={28}
              className="flex-1"
            />
          </>
        )}
      </Card>

      {/* Profit */}
      <Card
        variant="green"
        className="col-span-1 shadow-sm p-6 flex-1 flex gap-6 items-center"
      >
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="flex-1">
              <p className="text-base text-white/80 mb-2">Profit</p>
              <p
                className={`text-2xl font-semibold text-white ${
                  !showStat.profitStat ? "blur-sm" : ""
                }`}
              >
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                  maximumFractionDigits: 0,
                }).format(totalProfit)}
              </p>
              <button
                onClick={() => handleToggle("profitStat")}
                aria-label="Toggle profit visibility"
              >
                {showStat.profitStat ? (
                  <EyeOff size={20} color="#fff" />
                ) : (
                  <Eye size={20} color="#fff" />
                )}
              </button>
            </div>
            <Image
              src={"/svgs/Line-chart.svg"}
              alt="Profit chart"
              width={74}
              height={55}
              className="flex-1"
            />
          </>
        )}
      </Card>
    </div>
  );
}
