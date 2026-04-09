import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { Priority, RecurrencePattern, todoDB } from '@/lib/db';
import { getSingaporeNow, parseDateInput } from '@/lib/timezone';

const priorityValues: Priority[] = ['high', 'medium', 'low'];
const recurrenceValues: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly'];

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  due_date: z.string().optional().nullable(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  reminder_minutes: z.number().int().positive().optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ todos: todoDB.listByUser(session.userId) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const parsed = createTodoSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
  const body = parsed.data;
  const title = body.title.trim();

  const priority = body.priority ?? 'medium';
  if (!priorityValues.includes(priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  }

  const dueDate = parseDateInput(body.due_date);
  if (body.due_date && !dueDate) {
    return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
  }

  if (dueDate && dueDate.getTime() < getSingaporeNow().getTime() + 60_000) {
    return NextResponse.json({ error: 'Due date must be at least 1 minute in the future' }, { status: 400 });
  }

  const isRecurring = body.is_recurring ? 1 : 0;
  if (isRecurring && !body.recurrence_pattern) {
    return NextResponse.json({ error: 'Recurring todos require recurrence pattern' }, { status: 400 });
  }
  if (body.recurrence_pattern && !recurrenceValues.includes(body.recurrence_pattern)) {
    return NextResponse.json({ error: 'Invalid recurrence pattern' }, { status: 400 });
  }

  if (body.reminder_minutes != null && !dueDate) {
    return NextResponse.json({ error: 'Reminder requires due date' }, { status: 400 });
  }

  const todo = todoDB.create({
    user_id: session.userId,
    title,
    description: body.description ?? null,
    priority,
    due_date: dueDate ? dueDate.toISOString() : null,
    is_recurring: isRecurring,
    recurrence_pattern: body.recurrence_pattern ?? null,
    reminder_minutes: body.reminder_minutes ?? null,
    last_notification_sent: null,
    tags: [],
    subtasks: [],
  });

  return NextResponse.json({ todo }, { status: 201 });
}
