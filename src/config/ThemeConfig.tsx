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
          // Table paints the active-sort column with its own grey tint,
          // independently of row-selected/zebra-stripe backgrounds — those
          // three sources of `background` on the same <td> were fighting via
          // CSS specificity, and forcing one to win with `!important` (the
          // old approach) always broke one of the other two instead. Telling
          // AntD not to paint the sort tint at all removes the conflict at
          // its source rather than patching it per case.
          Table: {
            headerSortActiveBg: "transparent",
            headerSortHoverBg: "transparent",
            bodySortBg: "transparent",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeConfig;
