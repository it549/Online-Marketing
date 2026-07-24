import { redirect } from "next/navigation";
import { getSession } from "@/server/core/auth/dal";
import HomeShell from "@/components/HomeShell";

export default async function Home() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "ADMIN") {
        redirect("/forbidden");
    }

    return <HomeShell userEmail={session.email} />;
}
