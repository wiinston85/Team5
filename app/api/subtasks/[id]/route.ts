import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteSubtask, getSubtaskForUser, updateSubtask } from "@/lib/store";

function hasAccess(subtaskId: number, userId: number): boolean {
  return Boolean(getSubtaskForUser(userId, subtaskId));
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const subtaskId = Number(id);
  if (!hasAccess(subtaskId, session.userId)) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  const { title, completed } = (await request.json()) as { title?: string; completed?: boolean };

  if (title !== undefined && !title.trim()) {
    return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
  }

  updateSubtask(subtaskId, {
    title: title !== undefined ? title.trim() : undefined,
    completed: completed !== undefined ? (completed ? 1 : 0) : undefined
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const subtaskId = Number(id);
  if (!hasAccess(subtaskId, session.userId)) {
    return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
  }

  deleteSubtask(subtaskId);
  return NextResponse.json({ ok: true });
}
