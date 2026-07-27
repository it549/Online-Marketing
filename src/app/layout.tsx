import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Rungsiyo Marketing AI",
    description: "AI Marketing Dashboard สำหรับ Facebook & TikTok",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th" className={`${geist.variable} h-full`}>
            <body className="min-h-full bg-slate-100 text-slate-900">{children}</body>
        </html>
    );
}
