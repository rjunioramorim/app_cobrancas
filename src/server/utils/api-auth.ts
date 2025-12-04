import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AppError } from "./errors";

const BEARER_PREFIX = "Bearer ";

export function hashApiToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export async function getUserIdFromApiRequest(request: Request) {
    const session = await auth();
    if (session?.user?.id) {
        return session.user.id;
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith(BEARER_PREFIX)) {
        throw new AppError("Não autenticado", 401);
    }

    const apiKey = authHeader.slice(BEARER_PREFIX.length).trim();
    if (!apiKey) {
        throw new AppError("Token inválido", 401);
    }

    const hashed = hashApiToken(apiKey);
    const tokenRecord = await prisma.apiToken.findFirst({
        where: {
            tokenHash: hashed,
            OR: [
                { expiresAt: null },
                {
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            ],
            user: {
                isActive: true,
            },
        },
        select: {
            id: true,
            userId: true,
        },
    });

    if (!tokenRecord) {
        throw new AppError("Token inválido", 401);
    }

    await prisma.apiToken.update({
        where: { id: tokenRecord.id },
        data: { lastUsedAt: new Date() },
    });

    return tokenRecord.userId;
}

