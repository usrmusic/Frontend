import { Table, TableProps } from "antd";

const DataTable = ({ columns, dataSource, ...props }: TableProps) => {
  return (
    <div className="overflow-hidden rounded-xl">
      <Table
        columns={columns}
        dataSource={dataSource}
        {...props}
        className="[&_.ant-table-cell:before]:hidden"
      />
    </div>
  );
};

export default DataTable;
