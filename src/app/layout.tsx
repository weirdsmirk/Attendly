import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Attendly",
  description: "Personal attendance management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased flex h-screen overflow-hidden`}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 lg:p-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
