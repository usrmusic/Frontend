import React, { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

interface CardProps extends PropsWithChildren {
  variant?: "white" | "green";
  className?: string;
}

const Card = ({ children, variant = "white", className = "" }: CardProps) => {
  const bgVariant = {
    white: "#fff",
    green: "linear-gradient(140.63deg, #89A495 0.74%, #507160 103.5%)",
  };
  const bgColor = bgVariant[variant];
  const baseClasses = "rounded-3xl bg-white p-5";
  return (
    <div
      className={twMerge(baseClasses, className)}
      style={{ background: bgColor, boxShadow: "0px 1px 3px 0px #0000001A" }}
    >
      {children}
    </div>
  );
};

export default Card;
