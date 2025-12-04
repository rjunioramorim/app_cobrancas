import { PrismaClient, Role } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    // 🔐 Carrega senha do admin
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!process.env.ADMIN_PASSWORD) {
        console.warn("⚠️ ADMIN_PASSWORD não definido no .env; usando valor padrão (admin123).");
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const adminEmail = process.env.ADMIN_EMAIL || "admin@admin.com";

    // 👤 Criação / Atualização do usuário admin
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

    // 🧹 Limpeza das outras tabelas (em ordem segura)
    try {
        await prisma.cobranca.deleteMany({});
        await prisma.client.deleteMany({});
        await prisma.user.deleteMany({
            where: { email: { not: adminEmail } },
        });
    } catch (err) {
        console.error("⚠️ Erro ao limpar tabelas:", err);
    }

    console.log("✅ Seed executado com sucesso.");
    console.log(`   👤 Admin criado/atualizado: ${adminEmail}`);
}

main()
    .then(async () => await prisma.$disconnect())
    .catch(async (error) => {
        console.error("❌ Erro no seed:", error);
        await prisma.$disconnect();
        process.exit(1);
    });
