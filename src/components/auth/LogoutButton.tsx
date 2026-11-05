"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    className?: string;
    children?: React.ReactNode;
}

export default function LogoutButton({ className, children }: Props) {
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            router.push("/login");
            router.refresh();
        }
    }

    return (
        <button onClick={handleLogout} disabled={loggingOut} className={className} title={loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}>
            {children ?? (loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ")}
        </button>
    );
}
