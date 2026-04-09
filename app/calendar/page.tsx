'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Todo = { id: number; title: string; due_date: string | null };
type Holiday = { date: string; name: string };

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, offset: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [todosRes, holidaysRes] = await Promise.all([
      fetch('/api/todos'),
      fetch(`/api/holidays?year=${currentMonth.getUTCFullYear()}`),
    ]);

    const todosPayload = (await todosRes.json()) as { todos: Todo[] };
    const holidaysPayload = (await holidaysRes.json()) as { holidays: Holiday[] };

    setTodos(todosPayload.todos);
    setHolidays(holidaysPayload.holidays);
  }, [currentMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const cells = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const startOffset = firstDay.getUTCDay();
    const start = new Date(firstDay);
    start.setUTCDate(firstDay.getUTCDate() - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + index);
      const dateKey = day.toISOString().slice(0, 10);
      return {
        day,
        dateKey,
        isCurrentMonth: day.getUTCMonth() === currentMonth.getUTCMonth(),
        todos: todos.filter((todo) => todo.due_date?.slice(0, 10) === dateKey),
        holiday: holidays.find((holiday) => holiday.date === dateKey),
      };
    });
  }, [currentMonth, holidays, todos]);

  const modalTodos = selectedDate ? todos.filter((todo) => todo.due_date?.slice(0, 10) === selectedDate) : [];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Calendar View</h1>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>Prev</button>
          <button className="rounded border px-3 py-1" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>Today</button>
          <button className="rounded border px-3 py-1" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next</button>
          <Link href="/" className="rounded border px-3 py-1">Back</Link>
        </div>
      </header>

      <p className="mb-3 text-sm text-gray-600">{currentMonth.toLocaleString('en-SG', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((cell) => (
          <button
            key={cell.dateKey}
            className={`min-h-28 rounded border p-2 text-left ${cell.isCurrentMonth ? 'bg-white' : 'bg-gray-100'} ${cell.day.getUTCDay() === 0 || cell.day.getUTCDay() === 6 ? 'border-amber-300' : 'border-gray-200'}`}
            onClick={() => setSelectedDate(cell.dateKey)}
          >
            <p className="text-xs font-semibold">{cell.day.getUTCDate()}</p>
            {cell.holiday ? <p className="mt-1 text-[10px] text-red-600">{cell.holiday.name}</p> : null}
            {cell.todos.length > 0 ? <p className="mt-1 rounded bg-teal-100 px-1 text-[10px] text-teal-700">{cell.todos.length} todo(s)</p> : null}
          </button>
        ))}
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedDate(null)}>
          <div className="w-full max-w-md rounded bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-2 text-lg font-semibold">Todos on {selectedDate}</h2>
            {modalTodos.length === 0 ? <p className="text-sm text-gray-600">No todos.</p> : null}
            <ul className="space-y-2">
              {modalTodos.map((todo) => (
                <li key={todo.id} className="rounded border p-2 text-sm">{todo.title}</li>
              ))}
            </ul>
            <button className="mt-3 rounded border px-3 py-1 text-sm" onClick={() => setSelectedDate(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
