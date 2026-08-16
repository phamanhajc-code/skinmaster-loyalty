import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skinmaster Loyalty",
  description: "Hệ thống quản lý Thẻ thành viên & Chương trình Giới thiệu khách hàng — Skinmaster Medical and Academy",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
