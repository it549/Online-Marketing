import { NextRequest } from "next/server";
import { getDashboard } from "@/server/modules/dashboard/dashboard.controller";

export async function GET(request: NextRequest) {
    return getDashboard(request);
}
