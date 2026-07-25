"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    className?: string;
}

export default function LogoutButton({ className }: Props) {
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
        <button onClick={handleLogout} disabled={loggingOut} className={className}>
            {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
        </button>
    );
}
