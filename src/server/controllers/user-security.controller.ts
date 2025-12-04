import { ChangePasswordSchema } from "@/schemas/change-password.schema";
import { AuthService } from "../services/auth.service";

export const UserSecurityController = {
  async changePassword(userId: string, payload: unknown) {
    const data = ChangePasswordSchema.parse(payload);
    await AuthService.changePassword(userId, data);
  },
};


