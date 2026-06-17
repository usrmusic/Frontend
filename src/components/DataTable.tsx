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
        className="[&_.ant-table-cell:before]:hidden [&_.ant-table-content]:overflow-auto [&_.ant-table-pagination]:px-4 [&_.ant-table-pagination]:pb-3"
      />
    </div>
  );
}

export default DataTable;
