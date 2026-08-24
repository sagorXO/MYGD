import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClickToComponent } from "@/components/ClickToComponent";

export const metadata: Metadata = {
  title: "MY GERMAN DÖNER — Self-Service Kiosk",
  description: "The Original Berlin Kebab - Self-Service Ordering Terminal (Cyprus)",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1A1A1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#1A1A1A] text-white">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#1A1A1A] text-white antialiased min-h-screen selection:bg-orange-500 selection:text-white">
        {children}
        <ClickToComponent />
      </body>
    </html>
  );
}
