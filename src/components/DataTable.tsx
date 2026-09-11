import { Table } from "antd";
import type { TableProps } from "antd";

type DataTableProps<RecordType extends object = any> = TableProps<RecordType> & {
  wrapperClassName?: string;
};

function DataTable<RecordType extends object = any>({ wrapperClassName, ...props }: DataTableProps<RecordType>) {
  return (
    <div className={wrapperClassName ?? "overflow-hidden rounded-xl"}>
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
        {...props}
        // The sort-column/header grey tint is disabled at the theme level
        // (ThemeConfig.tsx's Table tokens) rather than fought here with
        // `!important` overrides — those kept winning against whichever of
        // row-selection or the zebra stripe painted the same cell, breaking
        // one to fix the other.
        className="[&_.ant-table-cell:before]:hidden [&_.ant-table-content]:overflow-auto [&_.ant-table-pagination]:!pl-4 [&_.ant-table-pagination]:!pr-8 [&_.ant-table-pagination]:!pb-3"
      />
    </div>
  );
}

export default DataTable;
