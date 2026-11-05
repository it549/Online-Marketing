import { prisma } from "@/server/database/prisma";

// Postgres compares text case-sensitively (MySQL's default collation did not),
// so match case-insensitively to keep "Admin@x.com" logging in as before.
export function findUserByEmail(email: string) {
    return prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
}
