import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { subtaskDB, templateDB, todoDB } from '@/lib/db';
import { addDays, getSingaporeNow } from '@/lib/timezone';

const useTemplateBodySchema = z.object({
  dueOffsetDays: z.number().int().nonnegative().optional(),
});

const templateDataSchema = z.object({
  description: z.string().optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  reminder_minutes: z.number().int().positive().optional().nullable(),
  subtasks: z.array(z.object({ title: z.string(), position: z.number().int().optional() })).optional(),
  tagIds: z.array(z.number().int()).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const template = templateDB.getById(session.userId, Number(id));
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const bodyParsed = useTemplateBodySchema.safeParse(await request.json());
  if (!bodyParsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  let templateJson: unknown;
  try {
    templateJson = JSON.parse(template.template_data);
  } catch {
    return NextResponse.json({ error: 'Template data is malformed' }, { status: 400 });
  }

  const templateDataParsed = templateDataSchema.safeParse(templateJson);
  if (!templateDataParsed.success) {
    return NextResponse.json({ error: 'Template data is invalid' }, { status: 400 });
  }
  const body = bodyParsed.data;
  const templateData = templateDataParsed.data;

  const dueDate = body.dueOffsetDays ? addDays(getSingaporeNow(), body.dueOffsetDays).toISOString() : null;

  const todo = todoDB.create({
    user_id: session.userId,
    title: template.title,
    description: templateData.description ?? null,
    priority: templateData.priority ?? 'medium',
    due_date: dueDate,
    is_recurring: templateData.is_recurring ? 1 : 0,
    recurrence_pattern: templateData.recurrence_pattern ?? null,
    reminder_minutes: templateData.reminder_minutes ?? null,
    last_notification_sent: null,
    tags: [],
    subtasks: [],
  });

  (templateData.subtasks ?? []).forEach((item, index) => {
    subtaskDB.create(todo.id, item.title, item.position ?? index);
  });

  return NextResponse.json({ todo: todoDB.getById(session.userId, todo.id) });
}
