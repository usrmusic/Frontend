"use client";

import { useState, useEffect } from "react";
import { Spin, Select, Avatar } from "antd";
import Image from "next/image";
import AxiosInstance from "@/src/lib/axios";
import { useDebounce } from "@/src/hooks/useDebounce";
import { useDashboardDropdown } from "@/src/api/dasboard";
import { MagnifyingGlass, Plus } from "@/src/components/Icons";
import Link from "next/link";

interface Session {
  user?: {
    name?: string;
    nickname?: string;
  };
}

const Header = () => {
  
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const debounced = useDebounce<string>(search, 300);
  const dropdownParams = debounced.trim().length > 1 ? { search: debounced.trim() } : undefined;
  const { data: dropdownItems, isFetching: dropdownFetching } = useDashboardDropdown(dropdownParams);

  console.log("Dropdown items:", dropdownItems, "with search:", debounced);
  const [user, setUser] = useState<{ name?: string; profile_photo?: string } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await AxiosInstance.get<any>("/user");
        const payload = resp?.data?.data ? resp.data.data : resp?.data;
        const u = Array.isArray(payload) ? payload[0] : payload;
        if (mounted && u) setUser({ name: u.name || u.full_name || u.couple_name, profile_photo: u.profile_photo || u.avatar });
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const futureYears = 1;
  const pastYears = 4;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: futureYears + pastYears + 1 }, (_, i) => {
    const y = currentYear + futureYears - i;
    return { label: String(y), value: y };
  });

  const handleYearSelectChange = (val: string | number) => {
    const y = Number(val);
    setYear(y);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dashboard:yearChange", { detail: { year: y } }));
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = Number(e.target.value);
    setYear(y);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dashboard:yearChange", { detail: { year: y } }));
    }
  };

  const getImageSrc = (p?: string) => {
    if (!p) return undefined;
    // allow absolute URLs (http(s) or protocol-relative), data URIs, or root-relative paths
    if (/^(data:|https?:\/\/|\/\/)/i.test(p)) return p;
    if (p.startsWith("/")) return p;
    // treat plain filenames as root-relative
    return `/${p}`;
  };

  const imageSrc = getImageSrc(user?.profile_photo);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {imageSrc ? (
          <Image src={imageSrc} alt="avatar" width={48} height={48} className="rounded-full" />
        ) : (
          <Avatar size={48}>{user?.name ? user.name.split(" ").map(n=>n[0]).slice(0,2).join("") : "U"}</Avatar>
        )}
        <div>
          <h3 className="text-2xl font-raleway font-medium mb-1">Hello{user?.name ? `, ${user.name}` : ''}</h3>
          <p className="text-gray-100">Explore information and activity about your events</p>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div style={{ width: 320 }} className="rounded-full bg-white flex items-center pl-4 pr-2 h-12">
          <Select
            showSearch
            allowClear
            value={search || undefined}
            placeholder="Search..."
            onSearch={(val) => setSearch(val)}
            onSelect={(val, option) => setSearch((option as any)?.label || String(val))}
            notFoundContent={dropdownFetching ? <Spin size="small" /> : (dropdownParams ? <div className="text-sm text-gray-500">No results</div> : <div className="text-sm text-gray-500">Type to search</div>)}
            options={(dropdownItems || []).map((it) => ({ value: String(it.id), label: it.couple_name ?? it.client?.name ?? `#${it.id}` }))}
            loading={dropdownFetching}
            classNames={{ popup: { root: "rounded-md" } }}
            filterOption={false}
            suffixIcon={null}
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            className="flex-1 bg-transparent border-0 shadow-none"
          />

          <button className="shrink-0 bg-black w-10 h-10 flex items-center justify-center text-white rounded-full hover:bg-gray-800 transition-all duration-300 ml-2">
            {dropdownFetching ? <Spin size="small" /> : <MagnifyingGlass />}
          </button>
          </div>
        <div>
          <Select
            value={year}
            onChange={handleYearSelectChange}
            options={yearOptions}
            className="bg-white rounded-3xl text-xs"
            classNames={{ popup: { root: "rounded-md" } }}
            style={{ width: 120 }}
          />
        </div>
        <Link href={"/enquiry"}>
          <button className="size-12 flex items-center justify-center bg-white rounded-full">
            <Plus />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Header;
