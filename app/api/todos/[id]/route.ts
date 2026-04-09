import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTodo, deleteTodo, getTodo, getTodoTagIds, replaceTodoTags, updateTodo } from "@/lib/store";
import { addRecurrence, assertFutureDueDate } from "@/lib/timezone";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const todo = getTodo(session.userId, Number(id));
  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json({ todo });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const todoId = Number(id);
  const existing = getTodo(session.userId, todoId);

  if (!existing) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

  try {
    const body = (await request.json()) as Partial<{
      title: string;
      completed: boolean;
      due_date: string | null;
      priority: "high" | "medium" | "low";
      is_recurring: boolean;
      recurrence_pattern: "daily" | "weekly" | "monthly" | "yearly" | null;
      reminder_minutes: number | null;
      tag_ids: number[];
    }>;

    const title = body.title !== undefined ? body.title.trim() : existing.title;
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const dueDate = body.due_date !== undefined ? body.due_date : existing.due_date;
    if (dueDate) assertFutureDueDate(dueDate);

    const isRecurring = body.is_recurring !== undefined ? body.is_recurring : existing.is_recurring === 1;
    if (isRecurring && !dueDate) {
      return NextResponse.json({ error: "Recurring todos require due date" }, { status: 400 });
    }

    const completed = body.completed !== undefined ? (body.completed ? 1 : 0) : existing.completed;

    updateTodo(session.userId, todoId, {
      title,
      completed,
      due_date: dueDate,
      priority: body.priority || existing.priority,
      is_recurring: isRecurring ? 1 : 0,
      recurrence_pattern: (body.recurrence_pattern !== undefined ? body.recurrence_pattern : existing.recurrence_pattern) || null,
      reminder_minutes: body.reminder_minutes !== undefined ? body.reminder_minutes : existing.reminder_minutes,
      tag_ids: Array.isArray(body.tag_ids) ? body.tag_ids : undefined
    });

    const justCompletedRecurring = existing.completed === 0 && completed === 1 && isRecurring && dueDate;
    if (justCompletedRecurring) {
      const pattern = (body.recurrence_pattern !== undefined ? body.recurrence_pattern : existing.recurrence_pattern) || "daily";
      const nextDue = addRecurrence(new Date(dueDate), pattern).toISOString();

      const nextTodo = createTodo({
        user_id: session.userId,
        title,
        completed: 0,
        due_date: nextDue,
        priority: body.priority || existing.priority,
        is_recurring: 1,
        recurrence_pattern: pattern,
        reminder_minutes: body.reminder_minutes ?? existing.reminder_minutes,
        tag_ids: getTodoTagIds(todoId)
      });
      replaceTodoTags(session.userId, nextTodo.id, getTodoTagIds(todoId));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const deleted = deleteTodo(session.userId, Number(id));
  if (!deleted) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
