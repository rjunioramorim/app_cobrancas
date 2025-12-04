🚀 Guia Base de Desenvolvimento — Next.js + Prisma + API + Services + Auth

Este documento define padrões, estrutura, boas práticas e arquitetura para um projeto profissional usando:

Next.js (App Router)

Prisma ORM

API interna

Controllers + Services

Zod

NextAuth (ou outra estratégia)

📁 1. Estrutura de Pastas Recomendada
src/
 ├─ app/
 │   ├─ (ui pages + server components)
 │   └─ api/
 │        └─ users/
 │             └─ route.ts          → Controller da rota
 │        └─ auth/
 │             └─ [...nextauth]/route.ts
 ├─ server/
 │   ├─ services/
 │   │     ├─ user.service.ts       → Regras de negócio
 │   │     └─ auth.service.ts
 │   ├─ controllers/
 │   │     └─ user.controller.ts    → Orquestra requests
 │   ├─ utils/
 │   │     └─ errors.ts
 ├─ schemas/
 │   └─ user.schema.ts              → Validações Zod
 ├─ lib/
 │   └─ db.ts                       → Instância Prisma
 ├─ components/
 ├─ hooks/
 ├─ env.ts                          → Validação das variáveis ambiente
 └─ types/

📦 2. Configuração do Prisma

src/lib/db.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


Boas práticas:

Uma única instância do Prisma

Nunca chamar Prisma direto no componente ou na API

🧪 3. Validações com Zod

src/schemas/user.schema.ts

import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});


Toda entrada deve passar por um schema

Schemas ficam fora da API e UI

🧭 4. Controllers

Responsáveis por:

Receber dados da API

Validar com Zod

Chamar o service

Tratar exceções

src/server/controllers/user.controller.ts

import { RegisterSchema } from "@/schemas/user.schema";
import { UserService } from "../services/user.service";

export const UserController = {
  async createUser(data: unknown) {
    const parsed = RegisterSchema.parse(data);
    return await UserService.create(parsed);
  }
};

🔧 5. Services (Regra de Negócio)

Aqui entra:

Prisma

Hash de senha

Envio de e-mails

Regras complexas

src/server/services/user.service.ts

import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export const UserService = {
  async create({ name, email, password }) {
    const exists = await prisma.user.findUnique({ where: { email }});
    if (exists) throw new Error("Email already in use");

    const hash = await bcrypt.hash(password, 10);

    return prisma.user.create({
      data: { name, email, password: hash }
    });
  },
};


Regras:

Controllers nunca chamam Prisma diretamente

Services não retornam senhas ou dados sensíveis

🔌 6. API Routes (Backend do Next.js)

As API routes atuam como “entrypoints”.

src/app/api/users/route.ts

import { NextResponse } from "next/server";
import { UserController } from "@/server/controllers/user.controller";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await UserController.createUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}


Regras:

API somente recebe e envia resposta

Nada de Prisma aqui

Nada de lógica de negócio aqui

🔐 7. Autenticação (NextAuth Recomendado)

Instalação recomendada:

npm i next-auth @auth/prisma-adapter


Arquitetura:

src/
 ├─ auth/
 ├─ server/services/auth.service.ts
 └─ app/api/auth/[...nextauth]/route.ts


Exemplo minimal:

src/server/services/auth.service.ts

import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

export const AuthService = {
  async validateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    return user;
  }
};

🪪 8. Variáveis Ambiente com Validação

src/env.ts

import { z } from "zod";

export const env = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string(),
}).parse(process.env);


Evita bugs silenciosos.

🛡️ 9. Tratamento de Erros

Criar erro padrão:

src/server/utils/errors.ts

export class AppError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

🧹 10. Padrões e Boas Práticas
✔️ Fazer

Usar Zod em toda entrada

Deixar Services “puros e reutilizáveis”

Dividir o backend em camadas

Usar async/await sempre

Configurar ESLint + Prettier

Criar componentes reutilizáveis

Server Components sempre que possível

❌ Não fazer

Lógica de negócio dentro do componente

Prisma dentro do componente

Prisma dentro da API

Services chamando NextResponse

Variáveis ambiente sem validação

📦 11. Checklist Inicial do Projeto

 Criar estrutura de pastas

 Instalar Prisma + NextAuth

 Criar schemas Zod

 Criar serviços base (user/auth)

 Criar controllers

 Criar API routes

 Implementar DB + migration inicial

 Configurar autenticação

 Criar UI inicial (shadcn recomendado)

 Configurar ESLint, Prettier e Husky

 Criar .env + validação

🧭 12. Fluxo Geral da Arquitetura
UI (componente)
    ↓
API Route (route.ts)
    ↓
Controller
    ↓
Zod Schema (validação)
    ↓
Service (regra de negócio)
    ↓
Prisma (banco)