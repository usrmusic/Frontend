"use client";
import type { ChangeEvent, HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import Input from "@/src/components/Input";
import AutoGrowTextarea from "./AutoGrowTextarea";

type Props = {
  name: string;
  label: string;
  placeholder?: string;
  containerClassName?: string;
  value?: string | number | null;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  /** Desktop <Input> type (e.g. "email"); unchanged from the plain Input. */
  type?: string;
  /** Keyboard hint on a phone, e.g. "email". */
  inputMode?: HTMLAttributes<HTMLTextAreaElement>["inputMode"];
};

/* A one-line text field that, on a phone, wraps long text onto as many lines
   as it needs instead of scrolling sideways (so a long first dance, stag tune
   or venue name reads in full). From `sm` up it is the normal <Input>,
   unchanged.

   It still behaves as ONE line of text: Enter doesn't add a line break, and
   pasted line breaks become spaces — so nothing multi-line is ever saved into
   a single-line field. */
export default function PhoneWrapInput({
  name,
  label,
  placeholder,
  containerClassName,
  value,
  onChange,
  disabled,
  type,
  inputMode,
}: Props) {
  return (
    <>
      <Input
        name={name}
        label={label}
        type={type}
        placeholder={placeholder}
        containerClassName={twMerge(containerClassName, "max-sm:hidden")}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
      />
      <div className={twMerge("w-full sm:hidden", containerClassName)}>
        <label className="mb-1 text-xs flex items-center gap-1">{label}</label>
        <AutoGrowTextarea
          name={name}
          rows={1}
          inputMode={inputMode}
          autoCapitalize={inputMode === "email" ? "none" : undefined}
          // Same look as <Input> (h-10, rounded-xl, px-3) at one line.
          className={twMerge(
            "block min-h-10 w-full resize-none rounded-xl border border-gray-200 px-3 py-[9px] text-sm leading-5 outline-none",
            disabled && "cursor-not-allowed opacity-70",
          )}
          placeholder={placeholder}
          value={value ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\r?\n/g, " ");
            onChange?.(e);
          }}
          disabled={disabled}
        />
      </div>
    </>
  );
}
