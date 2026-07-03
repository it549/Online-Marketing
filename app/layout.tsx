import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nilaphatra Marketing AI",
  description: "AI Marketing Dashboard สำหรับ Facebook & TikTok",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}
