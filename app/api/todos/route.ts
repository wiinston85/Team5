import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTodo, getTodo, listTodos } from "@/lib/store";
import { assertFutureDueDate } from "@/lib/timezone";
import { sortTodos } from "@/lib/todo-store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const priority = url.searchParams.get("priority") || "all";
  const tagId = url.searchParams.get("tag") || "all";
  const completion = url.searchParams.get("completion") || "all";

  let todos = sortTodos(listTodos(session.userId));

  if (search) {
    todos = todos.filter((todo) => {
      const inTitle = todo.title.toLowerCase().includes(search);
      const inSubtasks = todo.subtasks.some((s) => s.title.toLowerCase().includes(search));
      const inTags = todo.tags.some((t) => t.name.toLowerCase().includes(search));
      return inTitle || inSubtasks || inTags;
    });
  }

  if (priority !== "all") todos = todos.filter((t) => t.priority === priority);
  if (tagId !== "all") todos = todos.filter((t) => t.tags.some((tag) => String(tag.id) === tagId));
  if (completion === "completed") todos = todos.filter((t) => t.completed === 1);
  if (completion === "incomplete") todos = todos.filter((t) => t.completed === 0);

  return NextResponse.json({ todos });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      title?: string;
      due_date?: string | null;
      priority?: "high" | "medium" | "low";
      is_recurring?: boolean;
      recurrence_pattern?: "daily" | "weekly" | "monthly" | "yearly" | null;
      reminder_minutes?: number | null;
      tag_ids?: number[];
    };

    const title = (body.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const priority = body.priority || "medium";
    if (!["high", "medium", "low"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    if (body.due_date) assertFutureDueDate(body.due_date);
    if (body.is_recurring && !body.due_date) {
      return NextResponse.json({ error: "Recurring todos require due date" }, { status: 400 });
    }

    const todo = createTodo({
      user_id: session.userId,
      title,
      completed: 0,
      due_date: body.due_date || null,
      priority,
      is_recurring: body.is_recurring ? 1 : 0,
      recurrence_pattern: body.recurrence_pattern || null,
      reminder_minutes: body.reminder_minutes ?? null,
      tag_ids: Array.isArray(body.tag_ids) ? body.tag_ids : []
    });

    return NextResponse.json({ todoId: todo.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
