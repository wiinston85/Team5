import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTodo, removeTodoTag, replaceTodoTags } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const todoId = Number(id);
  const todo = getTodo(session.userId, todoId);
  if (!todo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

  const { tagIds } = (await request.json()) as { tagIds?: number[] };
  if (!Array.isArray(tagIds)) return NextResponse.json({ error: "tagIds array is required" }, { status: 400 });

  replaceTodoTags(session.userId, todoId, tagIds);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const todoId = Number(id);
  const { tagId } = (await request.json()) as { tagId?: number };
  if (!tagId) return NextResponse.json({ error: "tagId is required" }, { status: 400 });

  const todo = getTodo(session.userId, todoId);
  if (!todo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

  removeTodoTag(session.userId, todoId, tagId);
  return NextResponse.json({ ok: true });
}
