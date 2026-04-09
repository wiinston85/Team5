'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface NotificationTodo {
  id: number;
  title: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied',
  );
  const sentRef = useRef<Set<number>>(new Set());

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  useEffect(() => {
    if (permission !== 'granted') {
      return;
    }

    const poll = async () => {
      const response = await fetch('/api/notifications/check');
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { todos: NotificationTodo[] };
      payload.todos.forEach((todo) => {
        if (sentRef.current.has(todo.id)) {
          return;
        }
        sentRef.current.add(todo.id);
        new Notification('Todo reminder', {
          body: todo.title,
        });
      });
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [permission]);

  return {
    permission,
    requestPermission,
  };
}
