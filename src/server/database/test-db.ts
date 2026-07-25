import { prisma } from "./prisma";

async function testDatabaseConnection() {
    try {
        await prisma.$connect();

        console.log("✅ Database connected successfully");

        const platforms = await prisma.platform.findMany();

        console.log("Platforms:", platforms);
    } catch (error) {
        console.error("❌ Database connection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseConnection();