import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { holidayDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const yearParam = request.nextUrl.searchParams.get('year');
  const year = Number(yearParam) || new Date().getUTCFullYear();
  return NextResponse.json({ holidays: holidayDB.listByYear(year) });
}
