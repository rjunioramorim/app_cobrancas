import { NextResponse } from "next/server";
import { CobrancaController } from "@/server/controllers/cobranca.controller";
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
    const cobranca = await CobrancaController.getOne(userId, resolvedParams);
    return NextResponse.json(cobranca);
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
    const cobranca = await CobrancaController.update(userId, resolvedParams, body);
    return NextResponse.json(cobranca);
  } catch (error) {
    return handleApiError(error);
  }
}

