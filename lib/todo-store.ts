import { getTodoById, listTodos } from "@/lib/store";
import type { Todo } from "@/types";

export function getTodoWithRelations(todoId: number): Todo | null {
  return getTodoById(todoId) || null;
}

export function getTodosForUser(userId: number): Todo[] {
  return listTodos(userId);
}

export function sortTodos(todos: Todo[]): Todo[] {
  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed - b.completed;
    const prio = priorityRank[a.priority] - priorityRank[b.priority];
    if (prio !== 0) return prio;

    if (a.due_date && b.due_date) {
      const due = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (due !== 0) return due;
    }

    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
