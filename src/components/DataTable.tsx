import { Table, TableProps } from "antd";

const DataTable = ({ ...props }: TableProps) => {
  return (
    <div className="overflow-hidden rounded-xl">
      <Table {...props} className="[&_.ant-table-cell:before]:hidden" />
    </div>
  );
};

export default DataTable;
