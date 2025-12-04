import { describe, expect, it } from "vitest";
import { CreateClientSchema } from "../client.schema";

describe("CreateClientSchema", () => {
  it("valida dados corretos", () => {
    const parsed = CreateClientSchema.parse({
      nome: "Cliente Teste",
      fone: "11 99999-0000",
      vencimento: 10,
      valor: 150.75,
      observacoes: "Cliente prioritário",
      ativo: true,
    });

    expect(parsed.nome).toBe("Cliente Teste");
    expect(parsed.vencimento).toBe(10);
  });

  it("falha para telefone inválido", () => {
    expect(() =>
      CreateClientSchema.parse({
        nome: "Cliente Teste",
        fone: "123",
        vencimento: 5,
        valor: 90,
      })
    ).toThrowError();
  });
});

