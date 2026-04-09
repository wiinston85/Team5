import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteTag, updateTag } from "@/lib/store";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { name, color } = (await request.json()) as { name?: string; color?: string };
  if (!name || !name.trim()) return NextResponse.json({ error: "Tag name is required" }, { status: 400 });

  try {
    const updated = updateTag(session.userId, Number(id), name.trim(), color || "#3B82F6");
    if (!updated) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const deleted = deleteTag(session.userId, Number(id));
  if (!deleted) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
