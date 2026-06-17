import { Button as AntdButton } from "antd";
import type { ButtonProps } from "antd";
import { twMerge } from "tailwind-merge";

interface BtnProps extends ButtonProps {
  showShadow?: boolean;
}

const Button = ({
  children,
  className,
  showShadow = true,
  style,
  ...props
}: BtnProps) => {
  const baseClasses = "text-sm!";

  return (
    <AntdButton
      {...props}
      className={twMerge(baseClasses, className)}
      style={{
        borderRadius: 9999,
        boxShadow: showShadow ? "0px 4px 4px 0px #0000001A" : "",
        ...style,
      }}
    >
      {children}
    </AntdButton>
  );
};

export default Button;
