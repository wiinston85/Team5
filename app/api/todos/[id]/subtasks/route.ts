import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { subtaskDB, todoDB } from '@/lib/db';

const createSubtaskSchema = z.object({
  title: z.string().trim().min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const todo = todoDB.getById(session.userId, Number(id));
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  const parsed = createSubtaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const title = parsed.data.title;

  const subtask = subtaskDB.create(todo.id, title, todo.subtasks?.length ?? 0);
  return NextResponse.json({ subtask }, { status: 201 });
}
