import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';

const createTemplateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  title: z.string().trim().min(1),
  template_data: z.string().min(1),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ templates: templateDB.listByUser(session.userId) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const parsed = createTemplateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const body = parsed.data;

  const template = templateDB.create(session.userId, {
    name: body.name,
    description: body.description?.trim() || null,
    category: body.category?.trim() || null,
    title: body.title,
    template_data: body.template_data,
  });

  return NextResponse.json({ template }, { status: 201 });
}
