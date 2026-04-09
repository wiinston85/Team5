import { NextResponse } from "next/server";
import { listHolidays } from "@/lib/store";

export async function GET() {
  const holidays = listHolidays();
  return NextResponse.json({ holidays });
}
