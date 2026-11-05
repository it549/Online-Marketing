import { redirect } from "next/navigation";
import { getSession } from "@/server/core/auth/dal";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
    const session = await getSession();

    if (session) {
        redirect(session.role === "ADMIN" ? "/" : "/forbidden");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <LoginForm />
        </div>
    );
}
