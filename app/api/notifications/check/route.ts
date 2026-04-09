import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listPendingNotifications } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ todos: [] });

  return NextResponse.json({ todos: listPendingNotifications(session.userId) });
}
