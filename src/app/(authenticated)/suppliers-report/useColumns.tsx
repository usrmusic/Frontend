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
          <select name="supplier" className="border rounded-lg w-[88px]">
            <option value=""></option>
            <option value="dj_mike">DJ Mike</option>
            <option value="dj_anna">DJ Anna</option>
            <option value="dj_sam">DJ Sam</option>
          </select>
        </div>
      ),
    },
    {
      key: "eventDate",
      dataIndex: "date",
      title: (
        <div>
          <p className="mb-1">Event Date</p>
          <select name="eventDate" className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="2024-05-01">2024-05-01</option>
            <option value="2024-05-03">2024-05-03</option>
            <option value="2024-05-05">2024-05-05</option>
          </select>
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
          <select name="startTime" className="border rounded-lg w-[90px]">
            <option value=""></option>
            <option value="18:00">18:00</option>
            <option value="19:00">19:00</option>
            <option value="17:00">17:00</option>
          </select>
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
          <select name="endTime" className="border rounded-lg w-[90px]">
            <option value=""></option>
            <option value="23:00">23:00</option>
            <option value="00:00">00:00</option>
            <option value="22:00">22:00</option>
          </select>
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
          <select name="venue" className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="Grand Hall">Grand Hall</option>
            <option value="Skyline Venue">Skyline Venue</option>
            <option value="Oceanic Lounge">Oceanic Lounge</option>
          </select>
        </div>
      ),
    },
    {
      key: "requirement",
      dataIndex: "requirement",
      title: (
        <div>
          <p className="mb-1">Requirement</p>
          <select name="requirement" className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="Lighting, Sound System">
              Lighting, Sound System
            </option>
            <option value="Sound System">Sound System</option>
            <option value="Lighting">Lighting</option>
          </select>
        </div>
      ),
    },
    {
      key: "payment",
      dataIndex: "payment",
      title: (
        <div>
          <p className="mb-1">Costs</p>
          <select name="costs" className="border rounded-lg w-[90px]">
            <option value=""></option>
            <option value="£300">£300</option>
            <option value="£250">£250</option>
            <option value="£200">£200</option>
          </select>
        </div>
      ),
    },
    {
      key: "quantity",
      dataIndex: "quantity",
      title: (
        <div>
          <p className="mb-1">Quantity</p>
          <select name="quantity" className="border rounded-lg w-[70px]">
            <option value=""></option>
            <option value={2}>2</option>
            <option value={1}>1</option>
          </select>
        </div>
      ),
    },
  ];

  return { columns };
};

export default useColumns;
