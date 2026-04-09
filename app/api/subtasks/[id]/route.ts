import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { subtaskDB } from '@/lib/db';

const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const subtaskId = Number(id);
  const ownedSubtask = subtaskDB.getByIdForUser(subtaskId, session.userId);
  if (!ownedSubtask) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }

  const parsed = updateSubtaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const body = parsed.data;
  const subtask = subtaskDB.update(subtaskId, {
    title: body.title,
    completed: body.completed === undefined ? undefined : Number(body.completed),
    position: body.position,
  });
  if (!subtask) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }
  return NextResponse.json({ subtask });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const subtaskId = Number(id);
  const ownedSubtask = subtaskDB.getByIdForUser(subtaskId, session.userId);
  if (!ownedSubtask) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }
  const removed = subtaskDB.remove(subtaskId);
  if (!removed) {
    return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
