import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { AppError } from "../utils/errors";
import type { ChangePasswordInput } from "@/schemas/change-password.schema";

export const AuthService = {
  async validateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        isActive: true,
        password: true,
      }
    });

    if (!user) {
      throw new AppError("Credenciais inválidas", 401);
    }

    if (!user.isActive) {
      throw new AppError("Usuário inativo", 403);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError("Credenciais inválidas", 401);
    }

    // Retorna usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    const validCurrent = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!validCurrent) {
      throw new AppError("Senha atual incorreta", 400);
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });
  },
};

