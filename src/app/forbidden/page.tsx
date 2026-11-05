import { redirect } from "next/navigation";
import { getSession } from "@/server/core/auth/dal";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function ForbiddenPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role === "ADMIN") {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-4 text-center">
            <h1 className="text-2xl font-bold text-white">403 - ไม่มีสิทธิ์เข้าถึง</h1>
            <p className="max-w-sm text-sm text-slate-400">
                บัญชี {session.email} ไม่มีสิทธิ์เข้าถึงข้อมูล Marketing Dashboard กรุณาติดต่อผู้ดูแลระบบหากต้องการสิทธิ์เข้าถึง
            </p>
            <LogoutButton className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white" />
        </div>
    );
}
