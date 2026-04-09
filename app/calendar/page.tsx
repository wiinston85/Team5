"use client";

import { useEffect, useMemo, useState } from "react";
import type { Todo } from "@/types";

function toYyyyMm(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Array<{ date: string; name: string }>>([]);
  const [month, setMonth] = useState(() => toYyyyMm(new Date()));

  useEffect(() => {
    const load = async () => {
      const [todoRes, holidayRes] = await Promise.all([fetch("/api/todos"), fetch("/api/holidays")]);
      if (todoRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      const todoJson = await todoRes.json();
      const holidayJson = await holidayRes.json();
      setTodos(todoJson.todos || []);
      setHolidays(holidayJson.holidays || []);
    };
    void load();
  }, []);

  const { year, monthIndex } = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  }, [month]);

  const firstWeekDay = new Date(year, monthIndex, 1).getDay();
  const total = daysInMonth(year, monthIndex);

  const cells: Array<{ day: number | null; dateKey: string | null }> = [];
  for (let i = 0; i < firstWeekDay; i += 1) cells.push({ day: null, dateKey: null });
  for (let d = 1; d <= total; d += 1) {
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateKey });
  }

  const byDate = new Map<string, Todo[]>();
  for (const todo of todos) {
    if (!todo.due_date) continue;
    const key = todo.due_date.slice(0, 10);
    const list = byDate.get(key) || [];
    list.push(todo);
    byDate.set(key, list);
  }

  const holidayMap = new Map(holidays.map((h) => [h.date, h.name]));

  const shiftMonth = (delta: number) => {
    const d = new Date(year, monthIndex + delta, 1);
    setMonth(toYyyyMm(d));
  };

  return (
    <main>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1>Calendar View</h1>
        <div className="row">
          <a href="/"><button>Back to Todos</button></a>
          <button onClick={() => shiftMonth(-1)}>Prev</button>
          <button onClick={() => setMonth(toYyyyMm(new Date()))}>Today</button>
          <button onClick={() => shiftMonth(1)}>Next</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <h2>{new Date(year, monthIndex, 1).toLocaleDateString("en-SG", { month: "long", year: "numeric" })}</h2>
        <div className="grid-calendar small" style={{ marginBottom: 8 }}>
          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat"
          ].map((name) => (
            <div key={name} style={{ fontWeight: 700 }}>{name}</div>
          ))}
        </div>

        <div className="grid-calendar">
          {cells.map((cell, idx) => {
            const list = cell.dateKey ? byDate.get(cell.dateKey) || [] : [];
            const holiday = cell.dateKey ? holidayMap.get(cell.dateKey) : null;
            return (
              <div key={`${cell.dateKey || "blank"}-${idx}`} className="calendar-cell">
                {cell.day ? <div style={{ fontWeight: 700 }}>{cell.day}</div> : null}
                {holiday ? <div className="small" style={{ color: "#dc2626" }}>{holiday}</div> : null}
                {list.slice(0, 3).map((todo) => (
                  <div key={todo.id} className="small" style={{ marginTop: 6 }}>
                    - {todo.title}
                  </div>
                ))}
                {list.length > 3 ? <div className="small">+{list.length - 3} more</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
