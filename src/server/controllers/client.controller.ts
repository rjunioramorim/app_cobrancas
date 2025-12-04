import {
    ClientIdSchema,
    CreateClientSchema,
    UpdateClientSchema,
} from "@/schemas/client.schema";
import { ClientService } from "../services/client.service";

export const ClientController = {
    async list(
        userId: string,
        filters?: { search?: string; status?: "ativo" | "inativo" | "todos" }
    ) {
        return ClientService.list(userId, filters);
    },

    async getOne(userId: string, params: unknown) {
        const { id } = ClientIdSchema.parse(params);
        return ClientService.findById(userId, id);
    },

    async create(userId: string, payload: unknown) {
        const data = CreateClientSchema.parse(payload);
        return ClientService.create(userId, data);
    },

    async update(userId: string, params: unknown, payload: unknown) {
        const { id } = ClientIdSchema.parse(params);
        const data = UpdateClientSchema.parse(payload);
        return ClientService.update(userId, id, data);
    },
};

