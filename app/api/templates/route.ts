import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTemplate, listTemplates } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = listTemplates(session.userId);
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  if (!body.name?.trim()) return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  if (!body.title_template?.trim()) return NextResponse.json({ error: "Template title is required" }, { status: 400 });

  const template = createTemplate({
    user_id: session.userId,
    name: body.name.trim(),
    description: body.description || null,
    category: body.category || null,
    title_template: body.title_template.trim(),
    priority: body.priority || "medium",
    is_recurring: body.is_recurring ? 1 : 0,
    recurrence_pattern: body.recurrence_pattern || null,
    reminder_minutes: body.reminder_minutes ?? null
  });

  return NextResponse.json({ templateId: template.id }, { status: 201 });
}
