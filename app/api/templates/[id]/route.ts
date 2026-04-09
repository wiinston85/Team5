import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteTemplate, updateTemplate } from "@/lib/store";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const body = (await request.json()) as {
    name?: string;
    description?: string | null;
    category?: string | null;
    title_template?: string;
    priority?: "high" | "medium" | "low";
    is_recurring?: boolean;
    recurrence_pattern?: "daily" | "weekly" | "monthly" | "yearly" | null;
    reminder_minutes?: number | null;
  };

  const updated = updateTemplate(session.userId, Number(id), {
    name: body.name?.trim(),
    description: body.description || null,
    category: body.category || null,
    title_template: body.title_template?.trim(),
    priority: body.priority || "medium",
    is_recurring: body.is_recurring ? 1 : 0,
    recurrence_pattern: body.recurrence_pattern || null,
    reminder_minutes: body.reminder_minutes ?? null
  });

  if (!updated) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const deleted = deleteTemplate(session.userId, Number(id));
  if (!deleted) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
