import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthErrorHandler } from "@/components/layout/AuthErrorHandler";
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
  title: "Oorah Admissions Portal",
  description: "Oorah Admissions Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthErrorHandler />
        {children}
      </body>
    </html>
  );
}
