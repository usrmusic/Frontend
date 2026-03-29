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
  ...props
}: BtnProps) => {
  const baseClasses = "text-sm!";

  return (
    <AntdButton
      {...props}
      className={twMerge(baseClasses, className)}
      style={{ boxShadow: showShadow ? "0px 4px 4px 0px #0000001A" : "" }}
    >
      {children}
    </AntdButton>
  );
};

export default Button;
