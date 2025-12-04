import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { AppError } from "../utils/errors";
import type { CreateUserInput } from "@/schemas/user.schema";

export const UserService = {
  async create(data: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existing) {
      throw new AppError("E-mail já cadastrado", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const created = await prisma.user.create({
      data: {
        nome: data.nome.trim(),
        email: data.email,
        password: passwordHash,
        role: data.role,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return created;
  },
};


