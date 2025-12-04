import { NextResponse } from "next/server";
import { ClientController } from "@/server/controllers/client.controller";
import { handleApiError, requireUserId } from "./_helpers";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as "ativo" | "inativo" | "todos") || "todos";

    const filters = {
      search,
      status,
    };

    const clients = await ClientController.list(userId, filters);
    return NextResponse.json(clients);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const client = await ClientController.create(userId, body);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

