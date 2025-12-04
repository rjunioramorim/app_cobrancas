import { LoginSchema } from "@/schemas/auth.schema";
import { AuthService } from "../services/auth.service";

export const AuthController = {
  async login(data: unknown) {
    const parsed = LoginSchema.parse(data);
    return await AuthService.validateUser(parsed.email, parsed.password);
  },
};

