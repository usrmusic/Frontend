import { Table } from "antd";
import type { TableProps } from "antd";

function DataTable<RecordType extends object = any>(props: TableProps<RecordType>) {
  return (
    <div className="overflow-hidden rounded-xl">
      <Table<RecordType>
        {...props}
        className="[&_.ant-table-cell:before]:hidden [&_.ant-table-content]:overflow-auto"
      />
    </div>
  );
}

export default DataTable;
