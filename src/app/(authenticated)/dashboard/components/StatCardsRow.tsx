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

   So each icon gets a FIXED box plus `object-contain`: the footprint is
   identical across all four cards while the artwork scales inside it, never
   stretched. `shrink-0` keeps flex from crushing them when a card gets narrow.
   The box steps down one notch between `xl` and `2xl`, which is exactly the
   band where four cards share a row and space is tightest. */
const SPARKLINE = { width: 64, height: 44 } as const;
const SPARKLINE_CLASS =
  "shrink-0 w-12 h-8 2xl:w-16 2xl:h-11 object-contain";

const BADGE = { width: 40, height: 40 } as const;
const BADGE_CLASS = "shrink-0 size-9 2xl:size-10 object-contain";

/* Cards sit on the same 12-column grid as the panels below them, so at `xl`
   the first two line up edge-to-edge with Event Overview and the last two with
   the Sales Analytics / Pending Payment pair. Below `xl` the panels collapse to
   one column, so the cards fall back to two-up and then one-up. */
const CARD_CLASS =
  "col-span-12 sm:col-span-6 xl:col-span-3 shadow-sm p-4 2xl:p-5 flex gap-3 2xl:gap-4 items-center min-w-0";

const LABEL_CLASS = "text-sm 2xl:text-base truncate";

/* The currency figures must never be clipped — a half-shown "£525,4…" is worse
   than a smaller number. A fixed `text-2xl` only fits the widest viewports, so
   the value scales with the viewport between 16px and 24px: at 1280px (where
   four cards first share a row) that lands near 17px, which holds a 9-digit
   formatted amount plus the eye toggle inside a quarter-width card. `truncate`
   stays purely as a safety net for absurd values. */
const VALUE_BASE = "text-[clamp(1rem,1.35vw,1.5rem)] leading-tight font-semibold";
const VALUE_CLASS = `${VALUE_BASE} truncate`;

/* ── Concealing a figure (the eye toggle) ──────────────────────────────────
   Blur is not fixable here, and it is worth writing down why so nobody spends
   another afternoon tuning the radius. A line of text occupies a rectangle, so
   blurring it produces a rectangular smear — that is the whole of it. A radius
   low enough to avoid the slab leaves the amount readable; one high enough to
   conceal it fuses the digits into a solid bar, and a bar reads as a filled
   box however soft its edges are. Feathering the edges with a `mask-image`
   gradient only swaps the rectangle for an ellipse, and dropping the opacity
   turns it into a grey smudge. All four were tried against a rendered
   comparison; none of them stop reading as a box.

   So the digits are replaced rather than obscured. The pound sign stays at full
   size and full weight so the card keeps its shape and meaning, and the amount
   becomes evenly-tracked dots set slightly smaller and optically centred — the
   convention every banking app converged on, for exactly this reason.

   Sized in `em` so it tracks `VALUE_BASE`'s `clamp()` as the viewport changes.

   The dot count is fixed rather than derived from the value's length: matching
   the length would leak the order of magnitude, which is most of what a glance
   over your shoulder is after. It also means the concealed width is stable, so
   toggling never nudges the card's layout.

   Worth noting this conceals better than blur did as well — blurred text is
   still sitting in the DOM to be selected, copied, or sharpened back out of a
   screenshot. */
function StatValue({
  value,
  concealed,
  className = "",
}: {
  value: string;
  concealed: boolean;
  className?: string;
}) {
  return (
    <p
      className={`${VALUE_CLASS} ${className}`}
      aria-label={concealed ? "Amount hidden" : undefined}
    >
      {concealed ? (
        <>
          £
          <span className="ml-1 inline-block align-[0.12em] text-[0.68em] tracking-[0.18em] select-none">
            ••••••
          </span>
        </>
      ) : (
        value
      )}
    </p>
  );
}

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

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
    <div className="grid grid-cols-12 gap-4">
      {/* Events total */}
      <Card variant="white" className={CARD_CLASS}>
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className={`${LABEL_CLASS} text-primary`}>Events</p>
              <p className={VALUE_CLASS}>{totalEvents}</p>
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
      <Card variant="white" className={CARD_CLASS}>
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
            <div className="flex-1 min-w-0">
              <p className={`${LABEL_CLASS} text-primary`}>Remaining</p>
              <p className={VALUE_CLASS}>{pendingPayments}</p>
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
        className={CARD_CLASS}
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
            <div className="flex-1 min-w-0">
              <p className={`${LABEL_CLASS} text-primary`}>Turn Over</p>
              <div className="flex items-center gap-2 min-w-0">
                <StatValue
                  value={GBP.format(totalTurnover)}
                  concealed={!showStat.turnOverStat}
                />
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
        className={CARD_CLASS}
        onClick={isLoading ? undefined : () => handleToggle("profitStat")}
      >
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className={`${LABEL_CLASS} text-white/80 mb-2`}>Profit</p>
              <div className="flex items-center gap-2 min-w-0">
                <StatValue
                  value={GBP.format(totalProfit)}
                  concealed={!showStat.profitStat}
                  className="text-white"
                />
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
