import { CreateUserSchema } from "@/schemas/user.schema";
import { UserService } from "../services/user.service";

export const UserController = {
  async create(payload: unknown) {
    const data = CreateUserSchema.parse(payload);
    return UserService.create(data);
  },
};


