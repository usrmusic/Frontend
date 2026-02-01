import { Button as AntdButton } from "antd";
import type { ButtonProps } from "antd";
import { twMerge } from "tailwind-merge";

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  const baseClasses = "text-sm!";

  return (
    <AntdButton
      {...props}
      className={twMerge(baseClasses, className)}
      style={{ boxShadow: "0px 4px 4px 0px #0000001A" }}
    >
      {children}
    </AntdButton>
  );
};

export default Button;
