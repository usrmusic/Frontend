import React, { Ref, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "ref"
> {
  ref?: Ref<HTMLInputElement>;
  label?: string;
  labelIcon?: ReactNode; // Added labelIcon prop with ReactNode type
  error?: string;
  containerClassName?: string;
  type?: string;
}

const Input = ({
  ref,
  type = "text",
  label,
  labelIcon,
  error,
  className,
  containerClassName,
  disabled,
  ...props
}: InputProps) => {
  return (
    <div className={twMerge("w-full", containerClassName)}>
      {label && (
        <label className="mb-1 text-xs flex items-center gap-1">
          {labelIcon && <span className="mr-1">{labelIcon}</span>}
          {label}
        </label>
      )}

      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={twMerge(
          "h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none bg-secondary-100",
          disabled && "cursor-not-allowed bg-gray-100 opacity-70",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className,
        )}
        {...props}
      />

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
