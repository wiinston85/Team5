import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

const updateTagSchema = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const parsed = updateTagSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const tag = tagDB.update(session.userId, Number(id), parsed.data.name, parsed.data.color || '#0f766e');
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }
  return NextResponse.json({ tag });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  const removed = tagDB.remove(session.userId, Number(id));
  if (!removed) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
