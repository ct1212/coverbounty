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
  title: "CoverBounty — Crowdfund the Setlist",
  description:
    "Real-time crowdfunding for live music. Fans pool money to request songs. Bands get paid when they play them.",
  openGraph: {
    title: "CoverBounty — Crowdfund the Setlist",
    description:
      "Fans pool money to request songs at live shows. Bands see ranked bounties and get paid when they play them.",
    type: "website",
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
