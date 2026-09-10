import { Table } from "antd";
import type { TableProps } from "antd";

type DataTableProps<RecordType extends object = any> = TableProps<RecordType> & {
  wrapperClassName?: string;
};

function DataTable<RecordType extends object = any>({ wrapperClassName, ...props }: DataTableProps<RecordType>) {
  return (
    <div className={wrapperClassName ?? "overflow-hidden rounded-xl"}>
      <Table<RecordType>
        {...props}
        // AntD applies a grey background in three separate places around
        // sorting — the sorted column's cells (.ant-table-column-sort), the
        // sortable header's hover state, and its active/click-press state —
        // all stripped here, app-wide, rather than per-page.
        className="[&_.ant-table-cell:before]:hidden [&_.ant-table-content]:overflow-auto [&_.ant-table-pagination]:!pl-4 [&_.ant-table-pagination]:!pr-8 [&_.ant-table-pagination]:!pb-3 [&_.ant-table-column-sort]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent"
      />
    </div>
  );
}

export default DataTable;
