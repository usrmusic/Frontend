import { ConfigProvider } from "antd";
import { ReactNode } from "react";

export const colorPrimaryGradient =
  "linear-gradient(90deg, #7A9683 0%, #B6E2C6 100%)";

const ThemeConfig = ({ children }: { children: ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#719984",
          borderRadius: 12,
          /* Was `var(--font-inter)`, a variable that is not defined anywhere in
             the project. Ant Design therefore fell back to its own default
             stack while plain HTML rendered in Poppins, so every form showed
             two different typefaces side by side. Pointing it at the shared
             token keeps AntD controls, labels and headings on one font. */
          fontFamily: "var(--font-sans)",
          fontSize: 14,
        },
        components: {
          Button: {
            borderRadius: 9999,
          },
          Select: {
            selectorBg: "#F1F1F3",
            controlHeight: 40,
            borderRadius: 12,
          },
          DatePicker: {
            colorBgContainer: "#F1F1F3",
            controlHeight: 40,
            borderRadius: 12,
          },
          InputNumber: {
            colorBgContainer: "#F1F1F3",
            controlHeight: 40,
            borderRadius: 12,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeConfig;
