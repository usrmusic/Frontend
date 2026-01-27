import { Poppins, Raleway } from "next/font/google";

export const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});
export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});
