import { PrismaClient, Role } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("password", 10);

    const adminEmail = "admin@admin.com";

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: passwordHash,
            role: Role.ADMIN,
            isActive: true,
            mustChangePassword: false,
        },
        create: {
            nome: "Administrador",
            email: adminEmail,
            password: passwordHash,
            role: Role.ADMIN,
            isActive: true,
            mustChangePassword: false,
        },
    });

    // Remove todos os demais usuários, clientes e cobranças
    await prisma.cobranca.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({
        where: { email: { not: adminEmail } },
    });

    console.log("✅ Seed concluído:");
    console.log(`   - Admin: ${adminEmail}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error("Erro ao executar seed:", error);
        await prisma.$disconnect();
        process.exit(1);
    });

