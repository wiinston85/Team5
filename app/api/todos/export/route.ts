import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exportForUser } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "json").toLowerCase();

  const exported = exportForUser(session.userId);

  const date = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const header = ["ID", "Title", "Completed", "Due Date", "Priority", "Recurring", "Pattern", "Reminder"].join(",");
    const rows = exported.todos.map((t) =>
      [
        t.id,
        JSON.stringify(String(t.title || "")),
        t.completed,
        t.due_date || "",
        t.priority || "",
        t.is_recurring,
        t.recurrence_pattern || "",
        t.reminder_minutes || ""
      ].join(",")
    );
    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename=todos-${date}.csv`
      }
    });
  }

  const jsonPayload = {
    ...exported
  };

  return new NextResponse(JSON.stringify(jsonPayload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename=todos-${date}.json`
    }
  });
}
