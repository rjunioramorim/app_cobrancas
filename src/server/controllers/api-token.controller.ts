import { CreateApiTokenSchema } from "@/schemas/api-token.schema";
import { ApiTokenService } from "../services/api-token.service";

export const ApiTokenController = {
  async listUsers(filters: { search?: string; cursor?: string; limit: number }) {
    return ApiTokenService.listUsers(filters);
  },

  async listTokens(userId: string) {
    return ApiTokenService.listTokens(userId);
  },

  async createToken(userId: string, payload: unknown) {
    const data = CreateApiTokenSchema.parse(payload);
    return ApiTokenService.createToken(userId, data);
  },

  async revokeToken(tokenId: string) {
    await ApiTokenService.revokeToken(tokenId);
  },
};

