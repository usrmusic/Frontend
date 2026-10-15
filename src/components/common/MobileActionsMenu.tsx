"use client";
import { Dropdown, type MenuProps } from "antd";
import { MoreVertical } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* Phone-only ⋮ menu for a page's secondary actions. On a phone the toolbar
   keeps only the buttons the mobile design shows; everything else (Export,
   Send Brochure, filters, …) moves in here instead of stacking into extra
   button rows. Hidden from `sm` up, where the full toolbar is visible.

   Items are plain AntD menu items, so a `label` can be any node — e.g. a
   react-csv `CSVLink`, which keeps exports working exactly as the toolbar
   button does. */
const MORE_BUTTON_CLASS =
  "size-10 rounded-full bg-white flex items-center justify-center text-[#2A2D32] shadow-[0px_4px_4px_0px_#0000001A]";

export default function MobileActionsMenu({
  items,
  selectedKeys,
}: {
  items: MenuProps["items"];
  /** Highlights the current choice of a filter group inside the menu. */
  selectedKeys?: string[];
}) {
  if (!items?.length) return null;
  return (
    <div className="sm:hidden shrink-0">
      <Dropdown menu={{ items, selectedKeys }} trigger={["click"]} placement="bottomRight">
        {/* type="button": several of these sit inside a <form>. */}
        <button type="button" aria-label="More actions" className={MORE_BUTTON_CLASS}>
          <MoreVertical size={18} />
        </button>
      </Dropdown>
    </div>
  );
}

/* Same phone-only ⋮ button, but it runs one action directly instead of
   opening a menu — for pages where ⋮ simply opens that page's side panel
   (New Enquiry's summary, Confirmed Events' payment slide). */
export function MobileMoreButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="sm:hidden shrink-0">
      <button type="button" aria-label={label} onClick={onClick} className={MORE_BUTTON_CLASS}>
        <MoreVertical size={18} />
      </button>
    </div>
  );
}

/* Title-row slot for pages whose title is rendered by a shared layout (the
   Users tab group): the layout renders <TitleActionsSlot />, the page renders
   <TitleActions>…</TitleActions> and its content is portalled into the slot. */
const SLOT_ID = "page-title-actions";

export function TitleActionsSlot() {
  return <div id={SLOT_ID} className="ml-auto flex items-center gap-2" />;
}

const noopSubscribe = () => () => {};

export function TitleActions({ children }: { children: ReactNode }) {
  const slot = useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById(SLOT_ID),
    () => null,
  );
  return slot ? createPortal(children, slot) : null;
}
