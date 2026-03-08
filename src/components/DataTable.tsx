import { Table, TableProps } from "antd";

const DataTable = ({ columns, dataSource, ...props }: TableProps) => {
  return (
    <div className="overflow-hidden rounded-xl whitespace-nowrap">
      <Table
        columns={columns}
        dataSource={dataSource}
        {...props}
        className="[&_.ant-table-cell:before]:hidden [&_.ant-table-content]:overflow-auto"
      />
    </div>
  );
};

export default DataTable;
