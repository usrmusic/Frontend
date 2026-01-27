import React, { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  variant: "white" | "green";
  className?: string;
}

const Card = ({ children, variant, className = "" }: CardProps) => {
  const bgVariant = {
    white: "#fff",
    green: "linear-gradient(140.63deg, #89A495 0.74%, #507160 103.5%)",
  };
  const bgColor = bgVariant[variant];
  return (
    <div
      className={`rounded-3xl bg-white p-5 ${className}`}
      style={{ background: bgColor }}
    >
      {children}
    </div>
  );
};

export default Card;
