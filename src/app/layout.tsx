import type { Metadata } from "next";
import "./globals.css";
import { poppins } from "../lib/fonts";
import ClientProviders from "../config/ClientProviders";

export const metadata: Metadata = {
  title: "USR Music",
  description: "Discover, Play, and Share Your Favorite Tunes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased`} suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
