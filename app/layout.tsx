import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css"; // Your global stylesheet
import { cn } from "@/lib/utils";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Miner Helmet IoT Monitoring",
  description: "Real-time safety monitoring for mining workers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* --- ADDED --- */}
        {/* This stylesheet is required for react-leaflet to work */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {/* --- END ADDED --- */}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased dark", // Force dark mode as per your CSS
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        {/* Main Header shared across all pages */}
        <Header />

        {/* Page content */}
        <main>{children}</main>
      </body>
    </html>
  );
}