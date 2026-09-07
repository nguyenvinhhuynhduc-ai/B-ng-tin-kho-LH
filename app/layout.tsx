import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warehouse Compliance Hub",
  description: "Hệ thống quản lý tuân thủ kho vận",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#14181D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-bg text-ink">{children}</body>
    </html>
  );
}
