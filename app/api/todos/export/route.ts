import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { exportDB } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json(exportDB.allByUser(session.userId));
}
