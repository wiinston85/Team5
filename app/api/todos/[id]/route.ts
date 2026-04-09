import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { Priority, RecurrencePattern, todoDB } from '@/lib/db';
import { getSingaporeNow, parseDateInput } from '@/lib/timezone';

const priorityValues: Priority[] = ['high', 'medium', 'low'];
const recurrenceValues: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly'];

const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  due_date: z.string().optional().nullable(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  reminder_minutes: z.number().int().positive().optional().nullable(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const todo = todoDB.getById(session.userId, Number(id));
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }
  return NextResponse.json({ todo });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const todoId = Number(id);

  const parsed = updateTodoSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
  const body = parsed.data;

  if (body.priority && !priorityValues.includes(body.priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  }

  if (body.recurrence_pattern && !recurrenceValues.includes(body.recurrence_pattern)) {
    return NextResponse.json({ error: 'Invalid recurrence pattern' }, { status: 400 });
  }

  const dueDate = body.due_date === undefined ? undefined : parseDateInput(body.due_date);
  if (body.due_date && !dueDate) {
    return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
  }

  if (dueDate && dueDate.getTime() < getSingaporeNow().getTime() + 60_000) {
    return NextResponse.json({ error: 'Due date must be at least 1 minute in the future' }, { status: 400 });
  }

  const updated = todoDB.update(session.userId, todoId, {
    title: body.title?.trim() || undefined,
    description: body.description,
    completed: body.completed === undefined ? undefined : Number(body.completed),
    priority: body.priority,
    due_date: dueDate === undefined ? undefined : dueDate?.toISOString() ?? null,
    is_recurring: body.is_recurring === undefined ? undefined : Number(body.is_recurring),
    recurrence_pattern: body.recurrence_pattern,
    reminder_minutes: body.reminder_minutes,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  let nextInstance = null;
  if (updated.completed && updated.is_recurring && updated.recurrence_pattern) {
    nextInstance = todoDB.createNextRecurring(updated);
  }

  return NextResponse.json({ todo: updated, nextInstance });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const removed = todoDB.remove(session.userId, Number(id));
  if (!removed) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
