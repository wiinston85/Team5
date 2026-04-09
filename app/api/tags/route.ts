import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTag, listTags } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = listTags(session.userId);
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = (await request.json()) as { name?: string; color?: string };
  if (!name || !name.trim()) return NextResponse.json({ error: "Tag name is required" }, { status: 400 });

  try {
    const tag = createTag(session.userId, name.trim(), color || "#3B82F6");
    return NextResponse.json({ tagId: tag.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
