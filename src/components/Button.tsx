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
  // AntD's default disabled look (pale grey-on-grey) reads as barely-there
  // against this app's coloured toolbars — make "off" unambiguous (solid
  // grey, no shadow) so it doesn't get mistaken for a rendering glitch, and
  // let the enabled state keep its normal solid appearance so the contrast
  // between the two is obvious at a glance.
  const disabledClasses =
    "disabled:opacity-100! disabled:bg-gray-200! disabled:text-gray-400! disabled:border-gray-200! disabled:shadow-none!";

  return (
    <AntdButton
      {...props}
      className={twMerge(baseClasses, disabledClasses, className)}
      style={{
        borderRadius: 9999,
        boxShadow: showShadow && !props.disabled ? "0px 4px 4px 0px #0000001A" : "",
        ...style,
      }}
    >
      {children}
    </AntdButton>
  );
};

export default Button;
