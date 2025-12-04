import { auth } from "@/auth";
import { AppError } from "./errors";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new AppError("Não autorizado", 403);
  }

  return session;
}

