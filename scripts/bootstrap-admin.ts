import { PrismaClient, Role } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@admin.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error(
      "ADMIN_PASSWORD não definido. Configure a variável de ambiente ADMIN_PASSWORD antes de rodar o bootstrap."
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      nome: "Administrador",
      email,
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log("✅ Bootstrap de admin concluído:");
  console.log(`   - Admin: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Erro ao executar bootstrap de admin:", error);
    await prisma.$disconnect();
    process.exit(1);
  });


