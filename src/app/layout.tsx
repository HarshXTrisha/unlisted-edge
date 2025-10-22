import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unlisted Edge - Trade Unlisted Shares",
  description: "Access pre-IPO companies and exclusive investment opportunities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}