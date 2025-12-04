import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { AppError } from "../utils/errors";
import { hashApiToken } from "../utils/api-auth";
import type { CreateApiTokenInput } from "@/schemas/api-token.schema";

export const ApiTokenService = {
  async listUsers({
    search,
    cursor,
    limit,
  }: {
    search?: string;
    cursor?: string | null;
    limit: number;
  }) {
    const where = search
      ? {
        OR: [
          {
            nome: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
      : undefined;

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor
        ? {
          cursor: { id: cursor },
          skip: 1,
        }
        : {}),
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const userIds = users.map((user) => user.id);

    // Verificação de segurança: garantir que apiToken está disponível
    if (!prisma.apiToken) {
      throw new AppError(
        "Modelo ApiToken não está disponível no Prisma Client. Execute: npx prisma generate",
        500
      );
    }

    const tokenCounts = userIds.length
      ? await prisma.apiToken.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true },
      })
      : [];

    const countMap = new Map<string, number>();
    for (const token of tokenCounts) {
      countMap.set(token.userId, (countMap.get(token.userId) ?? 0) + 1);
    }

    const normalizedUsers = users.map((user) => ({
      ...user,
      tokens: countMap.get(user.id) ?? 0,
    }));

    const hasNextPage = normalizedUsers.length > limit;
    if (hasNextPage) {
      normalizedUsers.pop();
    }

    return {
      users: normalizedUsers,
      nextCursor: hasNextPage
        ? normalizedUsers[normalizedUsers.length - 1]?.id ?? null
        : null,
      hasNextPage,
    };
  },

  async listTokens(userId: string) {
    return prisma.apiToken.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  },

  async createToken(
    userId: string,
    data: CreateApiTokenInput
  ): Promise<{ id: string; token: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    if (!user.isActive) {
      throw new AppError("Usuário inativo", 400);
    }

    const plainToken = `ckt_${randomBytes(32).toString("hex")}`;
    const tokenHash = hashApiToken(plainToken);

    const created = await prisma.apiToken.create({
      data: {
        userId,
        name: data.name,
        tokenHash,
        expiresAt: data.expiresAt ?? null,
      },
      select: {
        id: true,
      },
    });

    return {
      id: created.id,
      token: plainToken,
    };
  },

  async revokeToken(tokenId: string) {
    const token = await prisma.apiToken.findUnique({
      where: { id: tokenId },
      select: { id: true },
    });

    if (!token) {
      throw new AppError("Token não encontrado", 404);
    }

    await prisma.apiToken.delete({
      where: { id: tokenId },
    });
  },
};

