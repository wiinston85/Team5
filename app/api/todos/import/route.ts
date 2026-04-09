import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { subtaskDB, tagDB, todoDB } from '@/lib/db';

const priorities = new Set(['high', 'medium', 'low']);
const recurrencePatterns = new Set(['daily', 'weekly', 'monthly', 'yearly']);

const importTodoSchema = z.object({
  title: z.string(),
  description: z.string().optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  due_date: z.string().optional().nullable(),
  is_recurring: z.union([z.boolean(), z.number().int()]).optional(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  reminder_minutes: z.number().int().optional().nullable(),
  tags: z.array(z.object({ name: z.string(), color: z.string() })).optional(),
  subtasks: z.array(z.object({ title: z.string(), position: z.number().int().optional() })).optional(),
});

const importPayloadSchema = z.object({
  todos: z.array(importTodoSchema),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const parsedPayload = importPayloadSchema.safeParse(await request.json());
  if (!parsedPayload.success) {
    return NextResponse.json({ error: 'Invalid import format' }, { status: 400 });
  }
  const body = parsedPayload.data;

  let imported = 0;
  for (const item of body.todos) {
    const title = item.title?.trim();
    if (!title) {
      return NextResponse.json({ error: 'Each imported todo requires a title' }, { status: 400 });
    }

    const priority = item.priority ?? 'medium';
    if (!priorities.has(priority)) {
      return NextResponse.json({ error: 'Invalid priority in import payload' }, { status: 400 });
    }

    if (item.recurrence_pattern && !recurrencePatterns.has(item.recurrence_pattern)) {
      return NextResponse.json({ error: 'Invalid recurrence pattern in import payload' }, { status: 400 });
    }

    if (item.reminder_minutes != null && !item.due_date) {
      return NextResponse.json({ error: 'Reminder requires due_date in import payload' }, { status: 400 });
    }

    const todo = todoDB.create({
      user_id: session.userId,
      title,
      description: item.description ?? null,
      priority,
      due_date: item.due_date ?? null,
      is_recurring: typeof item.is_recurring === 'boolean' ? Number(item.is_recurring) : (item.is_recurring ?? 0),
      recurrence_pattern: item.recurrence_pattern ?? null,
      reminder_minutes: item.reminder_minutes ?? null,
      last_notification_sent: null,
      tags: [],
      subtasks: [],
    });

    (item.subtasks ?? []).forEach((subtask, index) => {
      subtaskDB.create(todo.id, subtask.title, subtask.position ?? index);
    });

    (item.tags ?? []).forEach((tag) => {
      const existing = tagDB.listByUser(session.userId).find((entry) => entry.name.toLowerCase() === tag.name.toLowerCase());
      const finalTag = existing ?? tagDB.create(session.userId, tag.name, tag.color || '#0f766e');
      tagDB.assignToTodo(todo.id, finalTag.id);
    });

    imported += 1;
  }

  return NextResponse.json({ success: true, imported });
}
