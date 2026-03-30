import { TableColumnsType } from "antd";
import { Dispatch, SetStateAction } from "react";
import { Filters } from "./page";
import dayjs from "dayjs";

const useColumns = (
  filters: Filters,
  setFilters: Dispatch<SetStateAction<Filters>>,
) => {
  const columns: TableColumnsType = [
    {
      key: "name",
      dataIndex: "name",
      title: (
        <div>
          <p className="mb-1">Company</p>
        </div>
      ),
    },
    {
      key: "name",
      dataIndex: "client_name",
      title: (
        <div>
          <p className="mb-1">Client</p>
        </div>
      ),
    },
    {
      key: "date",
      dataIndex: "date",
      title: (
        <div>
          <p className="mb-1">Event Date</p>
        </div>
      ),
      render: (date) => <>{dayjs(date).format("DD-MM-YYYY")}</>,
    },
    {
      key: "eventStatus",
      dataIndex: "eventStatus",
      title: (
        <div>
          <p className="mb-1">Event Status</p>
        </div>
      ),
      render: (value: string) => {
        const map: Record<string, string> = {
          COMPLETED: "bg-green-100 text-green-700",
          CANCELLED: "bg-yellow-100 text-yellow-800",
          CONFIRMED: "bg-teal-100 text-teal-800",
        };
        const classes = map[value] || "bg-gray-100 text-gray-700";
        return (
          <span
            className={`${classes} px-3 py-1 rounded-full text-xs font-semibold inline-block`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "dj",
      dataIndex: "dj_name",
      title: (
        <div>
          <p className="mb-1">DJ</p>
        </div>
      ),
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
      key: "total_price",
      dataIndex: "total_price",
      title: (
        <div>
          <p className="mb-1">Total Price</p>
        </div>
      ),
    },
    {
      key: "total_cost",
      dataIndex: "total_cost",
      title: (
        <div>
          <p className="mb-1">Cost</p>
        </div>
      ),
    },
    {
      key: "extra_cost",
      dataIndex: "extra_cost",
      title: (
        <div>
          <p className="mb-1">Extra Cost</p>
        </div>
      ),
    },
    {
      key: "profit",
      dataIndex: "profit",
      title: (
        <div>
          <p className="mb-1">Profit</p>
        </div>
      ),
    },
    {
      key: "payment_received",
      dataIndex: "payment_received",
      title: (
        <div>
          <p className="mb-1">Payment Received</p>
        </div>
      ),
    },
    {
      key: "paymentOutstanding",
      dataIndex: "paymentOutstanding",
      title: (
        <div>
          <p className="mb-1">Payment Outstanding</p>
        </div>
      ),
    },
  ];

  const data = [
    {
      key: "1",
      company: "USI Music Ltd",
      client: "Gugan Sangha",
      eventDate: "02/08/2025",
      eventStatus: "COMPLETED",
      dj: "DJ Neetu",
      venue: "Sandon Hall",
      totalPrice: 9500,
      cost: 792,
      extraCost: 8708,
      profit: 9500,
      paymentReceived: 0,
      paymentOutstanding: 0,
    },
    {
      key: "2",
      company: "USI Music Ltd",
      client: "Margot Ghose",
      eventDate: "25/04/2025",
      eventStatus: "CANCELLED",
      dj: "DJ Neetu",
      venue: "TBC",
      totalPrice: 8500,
      cost: 0,
      extraCost: 8500,
      profit: 500,
      paymentReceived: 0,
      paymentOutstanding: 9000,
    },
    {
      key: "3",
      company: "USI Holding Ltd",
      client: "Arjun Singh",
      eventDate: "03/05/2025",
      eventStatus: "COMPLETED",
      dj: "DJ Neetu",
      venue: "Rose Gardens",
      totalPrice: 9500,
      cost: 525,
      extraCost: 895,
      profit: 0,
      paymentReceived: 0,
      paymentOutstanding: 9500,
    },
  ];

  return { columns, data };
};

export default useColumns;
