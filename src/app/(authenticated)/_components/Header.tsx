import { MagnifyingGlass, Plus } from "@/src/components/Icons";
import Link from "next/link";

interface Session {
  user?: {
    name?: string;
    nickname?: string;
  };
}

const Header = async () => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-2xl font-raleway font-medium mb-1">Hello</h3>
        <p className="text-gray-100">
          Explore information and activity about your events
        </p>
      </div>
      <div className="flex gap-4 items-center">
        <div className="w-70 bg-white pl-5 pr-2 rounded-full h-12 flex items-center">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white!"
          />
          <button className="shrink-0 bg-black size-10 flex items-center justify-center text-white rounded-full hover:bg-gray-800 transition-all duration-300">
            <MagnifyingGlass />
          </button>
        </div>
        <select
          name="year"
          id="year"
          className="bg-white w-15 rounded-3xl text-xs px-1"
        >
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
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
