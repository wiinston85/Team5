import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { importForUser } from "@/lib/store";

interface ImportPayload {
  version: string;
  todos: Array<Record<string, unknown>>;
  subtasks: Array<Record<string, unknown>>;
  tags: Array<Record<string, unknown>>;
  todo_tags: Array<{ todo_id: number; tag_id: number }>;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = (await request.json()) as ImportPayload;
    if (!Array.isArray(payload.todos)) {
      return NextResponse.json({ error: "Invalid import payload" }, { status: 400 });
    }

    const count = importForUser(session.userId, payload);
    return NextResponse.json({ message: `Successfully imported ${count} todos` });
  } catch (error) {
    return NextResponse.json({ error: `Failed to import todos: ${(error as Error).message}` }, { status: 400 });
  }
}
