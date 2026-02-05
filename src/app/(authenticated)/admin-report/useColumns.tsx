import { TableColumnsType } from "antd";
import React from "react";

type Filters = {
  company?: string;
  client?: string;
  eventDate?: string;
  eventStatus?: string;
  dj?: string;
  venue?: string;
};

const useColumns = (filters?: Filters, setFilters?: (f: Filters) => void) => {
  const columns: TableColumnsType = [
    {
      key: "company",
      dataIndex: "company",
      title: (
        <div>
          <p className="mb-1">Company</p>
          <select
            className="border rounded-lg w-[120px]"
            value={filters?.company || ""}
            onChange={(e) => setFilters && setFilters({ ...(filters || {}), company: e.target.value })}
          >
            <option value=""></option>
            <option value="USI Music Ltd">USI Music Ltd</option>
            <option value="USI Holding Ltd">USI Holding Ltd</option>
            <option value="Unique Soundz Roadshow Ltd">Unique Soundz Roadshow Ltd</option>
          </select>
        </div>
      ),
    },
    {
      key: "client",
      dataIndex: "client",
      title: (
        <div>
          <p className="mb-1">Client</p>
          <select
            className="border rounded-lg w-[140px]"
            value={filters?.client || ""}
            onChange={(e) => setFilters && setFilters({ ...(filters || {}), client: e.target.value })}
          >
            <option value=""></option>
            <option value="Gugan Sangha">Gugan Sangha</option>
            <option value="Margot Ghose">Margot Ghose</option>
            <option value="Arjun Singh">Arjun Singh</option>
          </select>
        </div>
      ),
    },
    {
      key: "eventDate",
      dataIndex: "eventDate",
      title: (
        <div>
          <p className="mb-1">Event Date</p>
          <select
            className="border rounded-lg w-[120px]"
            value={filters?.eventDate || ""}
            onChange={(e) => setFilters && setFilters({ ...(filters || {}), eventDate: e.target.value })}
          >
            <option value=""></option>
            <option value="02/08/2025">02/08/2025</option>
            <option value="25/04/2025">25/04/2025</option>
            <option value="03/05/2025">03/05/2025</option>
          </select>
        </div>
      ),
    },
    {
      key: "eventStatus",
      dataIndex: "eventStatus",
      title: (
        <div>
          <p className="mb-1">Event Status</p>
          <select
            className="border rounded-lg w-[120px]"
            value={filters?.eventStatus || ""}
            onChange={(e) => setFilters && setFilters({ ...(filters || {}), eventStatus: e.target.value })}
          >
            <option value=""></option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="CONFIRMED">CONFIRMED</option>
          </select>
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
          <span className={`${classes} px-3 py-1 rounded-full text-xs font-semibold inline-block`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "dj",
      dataIndex: "dj",
      title: (
        <div>
          <p className="mb-1">DJ</p>
          <select
            className="border rounded-lg w-[120px]"
            value={filters?.dj || ""}
            onChange={(e) => setFilters && setFilters({ ...(filters || {}), dj: e.target.value })}
          >
            <option value=""></option>
            <option value="DJ Neetu">DJ Neetu</option>
            <option value="DJ Jeevan">DJ Jeevan</option>
            <option value="Professional DJ">Professional DJ</option>
          </select>
        </div>
      ),
    },
    {
      key: "venue",
      dataIndex: "venue",
      title: (
        <div>
          <p className="mb-1">Venue</p>
          <select
            className="border rounded-lg w-[140px]"
            value={filters?.venue || ""}
            onChange={(e) => setFilters && setFilters({ ...(filters || {}), venue: e.target.value })}
          >
            <option value=""></option>
            <option value="Sandon Hall">Sandon Hall</option>
            <option value="TBC">TBC</option>
            <option value="Rose Gardens">Rose Gardens</option>
          </select>
        </div>
      ),
    },
    {
      key: "totalPrice",
      dataIndex: "totalPrice",
      title: (
        <div>
          <p className="mb-1">Total Price</p>
          <select className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="9500">9500</option>
            <option value="8500">8500</option>
            <option value="7500">7500</option>
          </select>
        </div>
      ),
    },
    {
      key: "cost",
      dataIndex: "cost",
      title: (
        <div>
          <p className="mb-1">Cost</p>
          <select className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="0">0</option>
            <option value="100">100</option>
            <option value="792">792</option>
          </select>
        </div>
      ),
    },
    {
      key: "extraCost",
      dataIndex: "extraCost",
      title: (
        <div>
          <p className="mb-1">Extra Cost</p>
          <select className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="8708">8708</option>
            <option value="8500">8500</option>
            <option value="895">895</option>
          </select>
        </div>
      ),
    },
    {
      key: "profit",
      dataIndex: "profit",
      title: (
        <div>
          <p className="mb-1">Profit</p>
          <select className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="9500">9500</option>
            <option value="500">500</option>
            <option value="0">0</option>
          </select>
        </div>
      ),
    },
    {
      key: "paymentReceived",
      dataIndex: "paymentReceived",
      title: (
        <div>
          <p className="mb-1">Payment Received</p>
          <select className="border rounded-lg w-[120px]">
            <option value=""></option>
            <option value="0">0</option>
            <option value="100">100</option>
            <option value="500">500</option>
          </select>
        </div>
      ),
    },
    {
      key: "paymentOutstanding",
      dataIndex: "paymentOutstanding",
      title: (
        <div>
          <p className="mb-1">Payment Outstanding</p>
          <select className="border rounded-lg w-[140px]">
            <option value=""></option>
            <option value="0">0</option>
            <option value="9000">9000</option>
            <option value="9500">9500</option>
          </select>
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
