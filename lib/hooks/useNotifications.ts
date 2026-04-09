"use client";

import { useEffect } from "react";

interface NotificationTodo {
  id: number;
  title: string;
  due_date: string;
}

export function useNotifications(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      const res = await fetch("/api/notifications/check");
      if (!res.ok) return;
      const data = (await res.json()) as { todos: NotificationTodo[] };
      for (const todo of data.todos) {
        new Notification("Todo reminder", {
          body: `${todo.title} is due at ${new Date(todo.due_date).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}`
        });
      }
    };

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 30_000);

    return () => window.clearInterval(id);
  }, [enabled]);
}
