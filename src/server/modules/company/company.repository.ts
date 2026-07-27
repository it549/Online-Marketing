import { prisma } from "@/server/database/prisma";

export async function listCompanies() {
    return prisma.company.findMany({ orderBy: { id: "asc" } });
}

export async function getCompanyById(id: bigint) {
    return prisma.company.findUnique({ where: { id } });
}
