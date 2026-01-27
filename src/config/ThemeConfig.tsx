import { ConfigProvider } from "antd";
import { ReactNode } from "react";

const ThemeConfig = ({ children }: { children: ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#719984",
          borderRadius: 8,
          fontFamily: "var(--font-inter)",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeConfig;
