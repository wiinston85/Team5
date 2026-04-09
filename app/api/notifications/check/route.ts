import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const due = todoDB.listForReminders(session.userId);
  for (const todo of due) {
    todoDB.update(session.userId, todo.id, { last_notification_sent: getSingaporeNow().toISOString() });
  }

  return NextResponse.json({ todos: due });
}
