import { Button as AntdButton } from "antd";
import type { ButtonProps } from "antd";
import { twMerge } from "tailwind-merge";

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  const baseClasses = "text-sm!";
  return (
    <AntdButton {...props} className={twMerge(baseClasses, className)}>
      {children}
    </AntdButton>
  );
};

export default Button;
