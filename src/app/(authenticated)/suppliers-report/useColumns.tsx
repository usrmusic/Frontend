import { TableColumnsType } from "antd";
import dayjs from "dayjs";

const useColumns = () => {
  const columns: TableColumnsType = [
    {
      key: "company_name",
      dataIndex: "company_name",
      title: (
        <div>
          <p className="mb-1">Supplier DJ</p>
        </div>
      ),
    },
    {
      key: "eventDate",
      dataIndex: "date",
      title: (
        <div>
          <p className="mb-1">Event Date</p>
        </div>
      ),
      render: (date) => <>{dayjs(date).format("MM-DD-YYYY")}</>,
    },
    {
      key: "startTime",
      dataIndex: "start_time",
      title: (
        <div>
          <p className="mb-1">Start Time</p>
        </div>
      ),
      render: (date) => <>{dayjs(date).format("MM-DD-YYYY")}</>,
    },
    {
      key: "endTime",
      dataIndex: "end_time",
      title: (
        <div>
          <p className="mb-1">End Time</p>
        </div>
      ),
      render: (date) => <>{dayjs(date).format("MM-DD-YYYY")}</>,
    },
    {
      key: "venue",
      dataIndex: "venue",
      title: (
        <div>
          <p className="mb-1">Venue</p>
        </div>
      ),
    },
    {
      key: "requirement",
      dataIndex: "requirement",
      title: (
        <div>
          <p className="mb-1">Requirement</p>
        </div>
      ),
    },
    {
      key: "payment",
      dataIndex: "payment",
      title: (
        <div>
          <p className="mb-1">Costs</p>
        </div>
      ),
    },
    {
      key: "quantity",
      dataIndex: "quantity",
      title: (
        <div>
          <p className="mb-1">Quantity</p>
        </div>
      ),
    },
  ];

  return { columns };
};

export default useColumns;
