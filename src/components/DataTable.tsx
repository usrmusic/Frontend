"use client";

import { Table, Empty, Pagination } from "antd";
import type { TableProps } from "antd";
import type { ReactNode } from "react";

type DataTableProps<RecordType extends object = any> = TableProps<RecordType> & {
  wrapperClassName?: string;
  /**
   * Opt this table into a stacked card list below `md` (768px).
   *
   * Two shapes of table live in this app and they want different mobile
   * treatments. Operational tables (Open Enquiry, Confirmed Events, Rig List)
   * get read on a phone in a venue, where sideways-scrolling to hunt for a
   * column is genuinely painful — those pass `mobileCard` and render as cards.
   * Admin tables (Users, Venues, Packages, Reports) are desk work; they only
   * need to not break, so they omit it and fall back to horizontal scroll.
   *
   * Receives the row and its index, returns the card body. The wrapper,
   * spacing, key and row-click wiring are handled here so each page only
   * decides *what* to show.
   */
  mobileCard?: (record: RecordType, index: number) => ReactNode;
  /** Row click handler for the card list. `onRow` is a desktop-table concept
   *  and is not consulted on mobile — cards state their own affordance. */
  onMobileCardClick?: (record: RecordType, index: number) => void;
};

function DataTable<RecordType extends object = any>({
  wrapperClassName,
  mobileCard,
  onMobileCardClick,
  ...props
}: DataTableProps<RecordType>) {
  const rows = (props.dataSource ?? []) as RecordType[];

  // AntD's rowKey accepts a string path or a function; normalise both so the
  // card list keys match the table's.
  const keyFor = (record: RecordType, index: number): string | number => {
    const rk = props.rowKey;
    if (typeof rk === "function") return rk(record, index) as string | number;
    if (typeof rk === "string") {
      const v = (record as Record<string, unknown>)[rk];
      if (typeof v === "string" || typeof v === "number") return v;
    }
    const id = (record as Record<string, unknown>).id;
    if (typeof id === "string" || typeof id === "number") return id;
    return index;
  };

  return (
    <div className={wrapperClassName ?? "overflow-hidden rounded-xl"}>
      {/* Desktop table. Hidden — not unmounted — when a card list is supplied,
          so AntD keeps its sort/selection state across a viewport resize. */}
      <div className={mobileCard ? "hidden md:block" : ""}>
        <Table<RecordType>
          // AntD's own toggle function (nextSortDirection) has no wraparound —
          // it just indexes one past the current entry in `sortDirections`, so
          // ["ascend","descend"] alone still produces undefined (i.e. "no
          // sort") after descend, once a column's sortOrder is controlled
          // externally (as every page here does via sortState). Repeating
          // "ascend" as a third entry closes the loop: descend's "next index"
          // resolves to that final "ascend" instead of running off the array,
          // so every click toggles asc/desc forever with no unsorted step.
          sortDirections={["ascend", "descend", "ascend"]}
          // AntD wraps every sortable header in a hover tooltip ("Click to
          // sort descending"). On a touch screen there is no hover: the first
          // tap only fires the emulated hover that opens the tooltip, and the
          // sort needs a SECOND tap — which is exactly the "have to click it
          // twice" report from Open Enquiry. The tooltip adds nothing on
          // desktop either (the arrow already says it), so it's off for every
          // table rather than patched per page.
          showSorterTooltip={false}
          // Horizontal scroll is the baseline mobile/narrow behaviour for every
          // table that does not supply its own card layout: all columns stay,
          // the user swipes. `max-content` rather than a fixed pixel width so
          // it never introduces a scrollbar on a wide screen that doesn't need
          // one. A page can still override by passing its own `scroll`.
          scroll={{ x: "max-content" }}
          {...props}
          // The sort-column/header grey tint is disabled at the theme level
          // (ThemeConfig.tsx's Table tokens) rather than fought here with
          // `!important` overrides — those kept winning against whichever of
          // row-selection or the zebra stripe painted the same cell, breaking
          // one to fix the other.
          className={`[&_.ant-table-cell:before]:hidden [&_.ant-table-content]:overflow-auto [&_.ant-table-pagination]:!pl-4 [&_.ant-table-pagination]:!pr-8 [&_.ant-table-pagination]:!pb-3 [&_.ant-table-pagination]:!flex-wrap [&_.ant-table-pagination]:!gap-y-2 ${props.className ?? ""}`}
        />
      </div>

      {mobileCard && (
        <div className="md:hidden">
          {props.loading ? (
            <div className="flex flex-col gap-2 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white rounded-xl py-10">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((record, index) => {
                const clickable = !!onMobileCardClick;
                return (
                  <div
                    key={keyFor(record, index)}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => onMobileCardClick(record, index) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onMobileCardClick(record, index);
                            }
                          }
                        : undefined
                    }
                    className={`bg-white rounded-xl p-4 ${clickable ? "active:bg-secondary-100 transition-colors" : ""}`}
                  >
                    {mobileCard(record, index)}
                  </div>
                );
              })}
            </div>
          )}

          {/* AntD renders pagination inside the table it is attached to, which
              is hidden here — so the card list needs its own, driven by the
              same `pagination` prop the page already passes. */}
          {props.pagination && typeof props.pagination === "object" && (
            <div className="flex justify-center py-4">
              <Pagination
                size="small"
                simple
                current={props.pagination.current}
                pageSize={props.pagination.pageSize}
                total={props.pagination.total}
                onChange={props.pagination.onChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;
