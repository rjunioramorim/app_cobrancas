import { NextResponse } from "next/server";
import { ClientController } from "@/server/controllers/client.controller";
import { handleApiError, requireUserId } from "../_helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const userId = await requireUserId();
    const resolvedParams = await params;
    const client = await ClientController.getOne(userId, resolvedParams);
    return NextResponse.json(client);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const userId = await requireUserId();
    const resolvedParams = await params;
    const body = await request.json();
    const client = await ClientController.update(userId, resolvedParams, body);
    return NextResponse.json(client);
  } catch (error) {
    return handleApiError(error);
  }
}

