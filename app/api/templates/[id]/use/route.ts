import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTodo, getTemplate } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const template = getTemplate(session.userId, Number(id));

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const body = (await request.json()) as { due_date?: string | null };

  const created = createTodo({
    user_id: session.userId,
    title: template.title_template,
    completed: 0,
    due_date: body.due_date || null,
    priority: template.priority,
    is_recurring: template.is_recurring,
    recurrence_pattern: template.recurrence_pattern,
    reminder_minutes: template.reminder_minutes,
    tag_ids: []
  });

  return NextResponse.json({ todoId: created.id }, { status: 201 });
}
