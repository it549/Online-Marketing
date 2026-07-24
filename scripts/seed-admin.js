require("dotenv").config();
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const KEY_LENGTH = 64;

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        const passwordHash = hashPassword(password);

        const user = await prisma.user.upsert({
            where: { email },
            update: { passwordHash, role: "ADMIN", isActive: true },
            create: { email, passwordHash, role: "ADMIN" },
        });

        console.log(`Admin account ready: ${user.email} (id ${user.id})`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
