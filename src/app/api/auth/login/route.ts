import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas/auth.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.parse(body);

    const result = await signIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

