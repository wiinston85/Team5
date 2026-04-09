import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { tagDB, todoDB } from '@/lib/db';

const todoTagSchema = z.object({
  tagId: z.number().int().positive(),
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
  const parsed = todoTagSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
  }
  const body = parsed.data;
  const tag = tagDB.getByIdForUser(session.userId, body.tagId);
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  tagDB.assignToTodo(todo.id, body.tagId);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const todo = todoDB.getById(session.userId, Number(id));
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }
  const parsed = todoTagSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
  }
  const body = parsed.data;
  const tag = tagDB.getByIdForUser(session.userId, body.tagId);
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }
  tagDB.removeFromTodo(todo.id, body.tagId);
  return NextResponse.json({ success: true });
}
