import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
      <body className="min-h-screen bg-bg text-ink">
        {children}

        {/* OneSignal Web SDK — handles its own service worker + permission
            prompt. No Firebase project or config file needed. */}
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer strategy="afterInteractive" />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
              });
            });
          `}
        </Script>
      </body>
    </html>
  );
}
