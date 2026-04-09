import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createSubtask, getTodo } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const todo = getTodo(session.userId, Number(id));
  if (!todo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

  const { title } = (await request.json()) as { title?: string };
  if (!title || !title.trim()) return NextResponse.json({ error: "Subtask title is required" }, { status: 400 });

  const created = createSubtask(Number(id), title.trim());

  return NextResponse.json({ subtaskId: created.id }, { status: 201 });
}
