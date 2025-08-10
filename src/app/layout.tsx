import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Moon Calendar",
    template: "%s — Moon Calendar",
  },
  description: "Beautiful lunar phases by city with infinite scroll and a printable poster view.",
  applicationName: "Moon Calendar",
  keywords: ["moon", "lunar phases", "calendar", "astronomy", "poster", "nextjs"],
  authors: [{ name: "Moon Calendar" }],
  themeColor: "#000000",
  icons: {
    icon: "icon.svg",
  },
  openGraph: {
    title: "Moon Calendar",
    description: "Beautiful lunar phases by city with infinite scroll and a printable poster view.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Moon Calendar",
    description: "Beautiful lunar phases by city with infinite scroll and a printable poster view.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
