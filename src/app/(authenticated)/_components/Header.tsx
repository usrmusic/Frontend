"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spin, Select } from "antd";
import UserAvatar from "@/src/components/common/Avatar";
import AxiosInstance from "@/src/lib/axios";
import { extractUser } from "@/src/lib/user";
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
  const router = useRouter();
  const pathname = usePathname();
  const debounced = useDebounce<string>(search, 300);

  // Reset search when navigating to a different page
  useEffect(() => {
    setSearch("");
  }, [pathname]);
  const dropdownParams = debounced.trim().length > 1 ? { search: debounced.trim() } : undefined;
  const { data: dropdownItems, isFetching: dropdownFetching } = useDashboardDropdown(dropdownParams);

  const [user, setUser] = useState<{ name?: string; profile_photo?: string } | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await AxiosInstance.get<unknown>("/user");
        const raw = resp?.data as unknown;
        const parsed = extractUser(raw);
        if (mounted && parsed) setUser(parsed);
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
        <UserAvatar
          src={imageSrc}
          initials={user?.name ? user.name.split(" ").map(n => n[0]).slice(0,2).join("") : "U"}
          size={48}
          className="rounded-full"
        />
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
            onSelect={(val, option) => {
              const idStr = String(val);
              let label = idStr;
              if (option && typeof option === 'object' && 'label' in (option as Record<string, unknown>)) {
                const maybeLabel = (option as Record<string, unknown>).label;
                if (typeof maybeLabel === 'string') label = maybeLabel;
              }
              setSearch(label);

              // determine event status from option if present, otherwise lookup from dropdownItems
              let statusId: number | string | undefined = undefined;
              try {
                if (option && typeof option === 'object' && 'status' in (option as any)) {
                  statusId = (option as any).status;
                }
              } catch (e) {}
              if (statusId === undefined && Array.isArray(dropdownItems)) {
                const found = dropdownItems.find((d) => String(d.id) === idStr);
                if (found) statusId = found.status;
              }

              let target = '/dashboard';
              if (statusId === 1 || statusId === '1') target = '/open-enquiry';
              else if (statusId === 2 || statusId === '2') target = '/confirmed-events';
              else if (statusId === 3 || statusId === '3') target = '/completed-events';

              try {
                router.push(`${target}?search=${encodeURIComponent(idStr)}&name=${encodeURIComponent(label)}`);
              } catch (e) {
                if (typeof window !== 'undefined') window.location.href = `${target}?search=${encodeURIComponent(idStr)}&name=${encodeURIComponent(label)}`;
              }
            }}
            notFoundContent={dropdownFetching ? <Spin size="small" /> : (dropdownParams ? <div className="text-sm text-gray-500">No results</div> : <div className="text-sm text-gray-500">Type to search</div>)}
            options={(dropdownItems || []).map((it) => ({ value: String(it.id), label: it.couple_name ?? it.client?.name ?? `#${it.id}`, status: it.status, clientId: it.client?.id }))}
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
