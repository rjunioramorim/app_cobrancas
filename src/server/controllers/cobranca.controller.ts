import {
  CobrancaIdSchema,
  CreateCobrancaSchema,
  UpdateCobrancaSchema,
} from "@/schemas/cobranca.schema";
import { CobrancaService } from "../services/cobranca.service";

export const CobrancaController = {
  async list(userId: string, filters?: { startDate?: Date; endDate?: Date }) {
    return CobrancaService.list(userId, filters);
  },

  async getOne(userId: string, params: unknown) {
    const { id } = CobrancaIdSchema.parse(params);
    return CobrancaService.findById(userId, id);
  },

  async create(userId: string, payload: unknown) {
    const data = CreateCobrancaSchema.parse(payload);
    return CobrancaService.create(userId, data);
  },

  async update(userId: string, params: unknown, payload: unknown) {
    const { id } = CobrancaIdSchema.parse(params);
    const data = UpdateCobrancaSchema.parse(payload);
    return CobrancaService.update(userId, id, data);
  },
};

