import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
    const email = process.env.SEED_ADMIN_EMAIL;
    const username = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !username || !password ) {
        console.log("ℹ️ SEED_ADMIN_* env vars not set - skipping admin seed.");
        return;
    }

    const existing = await prisma.admin.findUnique({ where: { email } });

    if (existing) {
        console.log(`ℹ️ Admin with email ${email} already exists - skipping.`);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create ({
        data: {
            email,
            username,
            password: hashedPassword,
            role: "SUPER_ADMIN",
        },
    });
    
    console.log(`👌 Super admin created: ${admin.email}`);
}

main()
    .catch((error) => {
        console.error("❌ Seed failed: ", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    })