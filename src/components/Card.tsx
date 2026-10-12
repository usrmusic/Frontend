import React, { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

interface CardProps extends PropsWithChildren {
  variant?: "white" | "green";
  className?: string;
  onClick?: () => void;
}

/* For a toolbar Card that holds only a search bar on a phone (its buttons
   moved into a ⋮ menu): drops the card's background, shadow and padding below
   `sm` so the search reads as a plain white bar. `!` is needed to beat the
   inline background/shadow styles below. */
export const MOBILE_PLAIN_CARD =
  "max-sm:bg-none! max-sm:bg-transparent! max-sm:shadow-none! max-sm:p-0! max-sm:rounded-none!";

const Card = ({ children, variant = "white", className = "", onClick }: CardProps) => {
  const bgVariant = {
    white: "#fff",
    green: "linear-gradient(140.63deg, #89A495 0.74%, #507160 103.5%)",
  };
  const bgColor = bgVariant[variant];
  const baseClasses = "rounded-3xl bg-white p-5";
  return (
    <div
      className={twMerge(baseClasses, onClick ? "cursor-pointer select-none" : "", className)}
      style={{ background: bgColor, boxShadow: "0px 1px 3px 0px #0000001A" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

export default Card;
