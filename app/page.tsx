'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { getSingaporeNow } from '@/lib/timezone';

type Priority = 'high' | 'medium' | 'low';
type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

type Tag = { id: number; name: string; color: string };
type Subtask = { id: number; title: string; completed: number; position: number };
type Todo = {
  id: number;
  title: string;
  description: string | null;
  completed: number;
  priority: Priority;
  due_date: string | null;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  tags: Tag[];
  subtasks: Subtask[];
};

type Template = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  title: string;
  template_data: string;
};

const reminderOptions = [15, 30, 60, 120, 1440, 2880, 10080];

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('daily');
  const [reminder, setReminder] = useState<number | ''>('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#0f766e');
  const [statusMessage, setStatusMessage] = useState('');
  const { permission, requestPermission } = useNotifications();

  async function loadData() {
    const [todosRes, tagsRes, templatesRes] = await Promise.all([
      fetch('/api/todos'),
      fetch('/api/tags'),
      fetch('/api/templates'),
    ]);

    if (todosRes.status === 401) {
      window.location.href = '/login';
      return;
    }

    const todosPayload = (await todosRes.json()) as { todos: Todo[] };
    const tagsPayload = (await tagsRes.json()) as { tags: Tag[] };
    const templatesPayload = (await templatesRes.json()) as { templates: Template[] };

    setTodos(todosPayload.todos);
    setTags(tagsPayload.tags);
    setTemplates(templatesPayload.templates);
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  async function createTodo(event: FormEvent) {
    event.preventDefault();
    setStatusMessage('');
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priority,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        reminder_minutes: reminder === '' ? null : Number(reminder),
      }),
    });

    const payload = (await response.json()) as { error?: string; todo?: Todo };
    if (!response.ok) {
      setStatusMessage(payload.error ?? 'Failed to create todo');
      return;
    }

    if (payload.todo) {
      for (const tagId of selectedTags) {
        await fetch(`/api/todos/${payload.todo.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagId }),
        });
      }
    }

    setTitle('');
    setDescription('');
    setDueDate('');
    setReminder('');
    setSelectedTags([]);
    await loadData();
  }

  async function toggleTodo(todo: Todo, completed: boolean) {
    await fetch(`/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    await loadData();
  }

  async function deleteTodo(id: number) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    await loadData();
  }

  async function addSubtask(todoId: number) {
    const titleInput = window.prompt('Subtask title');
    if (!titleInput) {
      return;
    }
    await fetch(`/api/todos/${todoId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleInput }),
    });
    await loadData();
  }

  async function toggleSubtask(subtaskId: number, completed: boolean) {
    await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    await loadData();
  }

  async function createTag(event: FormEvent) {
    event.preventDefault();
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName, color: newTagColor }),
    });
    setNewTagName('');
    await loadData();
  }

  async function saveTemplate(todo: Todo) {
    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${todo.title} Template`,
        description: todo.description,
        category: 'General',
        title: todo.title,
        template_data: JSON.stringify({
          description: todo.description,
          priority: todo.priority,
          is_recurring: Boolean(todo.is_recurring),
          recurrence_pattern: todo.recurrence_pattern,
          reminder_minutes: todo.reminder_minutes,
          subtasks: todo.subtasks.map((subtask) => ({ title: subtask.title, position: subtask.position })),
          tagIds: todo.tags.map((tag) => tag.id),
        }),
      }),
    });
    await loadData();
  }

  async function applyTemplate(templateId: number) {
    await fetch(`/api/templates/${templateId}/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueOffsetDays: 1 }),
    });
    await loadData();
  }

  async function exportTodos() {
    const response = await fetch('/api/todos/export');
    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'todos-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importTodos(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    const parsed = JSON.parse(text) as { todos?: unknown[] };
    if (!Array.isArray(parsed.todos)) {
      setStatusMessage('Invalid import format. Expecting a todos array.');
      return;
    }

    const normalizedTodos = parsed.todos.map((item) => {
      const current = item as {
        title?: string;
        description?: string | null;
        priority?: Priority;
        due_date?: string | null;
        is_recurring?: number;
        recurrence_pattern?: RecurrencePattern | null;
        reminder_minutes?: number | null;
        tags?: Array<{ name: string; color: string }>;
        subtasks?: Array<{ title: string; position?: number }>;
      };

      return {
        title: current.title ?? 'Imported todo',
        description: current.description ?? null,
        priority: current.priority ?? 'medium',
        due_date: current.due_date ?? null,
        is_recurring: current.is_recurring ?? 0,
        recurrence_pattern: current.recurrence_pattern ?? null,
        reminder_minutes: current.reminder_minutes ?? null,
        tags: Array.isArray(current.tags) ? current.tags : [],
        subtasks: Array.isArray(current.subtasks) ? current.subtasks : [],
      };
    });

    await fetch('/api/todos/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todos: normalizedTodos }),
    });
    await loadData();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const filtered = useMemo(() => {
    return todos.filter((todo) => {
      const textMatch = debouncedQuery
        ? `${todo.title} ${todo.tags.map((tag) => tag.name).join(' ')}`.toLowerCase().includes(debouncedQuery.toLowerCase())
        : true;
      const priorityMatch = priorityFilter === 'all' ? true : todo.priority === priorityFilter;
      const tagMatch = tagFilter == null ? true : todo.tags.some((tag) => tag.id === tagFilter);
      return textMatch && priorityMatch && tagMatch;
    });
  }, [todos, debouncedQuery, priorityFilter, tagFilter]);

  function priorityClass(value: Priority): string {
    if (value === 'high') return 'bg-red-100 text-red-700';
    if (value === 'medium') return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  }

  const nowIso = getSingaporeNow().toISOString();
  const overdue = filtered.filter((todo) => !todo.completed && todo.due_date && todo.due_date < nowIso);
  const active = filtered.filter((todo) => !todo.completed && (!todo.due_date || todo.due_date >= nowIso));
  const completed = filtered.filter((todo) => Boolean(todo.completed));

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Todo Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={logout} className="rounded border px-3 py-2 text-sm">Logout</button>
          <Link href="/calendar" className="rounded border px-3 py-2 text-sm">Calendar</Link>
        </div>
      </header>

      <section className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <form onSubmit={createTodo} className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Todo title" className="rounded border px-3 py-2" required />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="rounded border px-3 py-2" />
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className="rounded border px-3 py-2">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="rounded border px-3 py-2" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isRecurring} onChange={(event) => setIsRecurring(event.target.checked)} />Recurring</label>
          <select value={recurrencePattern} onChange={(event) => setRecurrencePattern(event.target.value as RecurrencePattern)} disabled={!isRecurring} className="rounded border px-3 py-2 disabled:bg-gray-100">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select value={reminder} onChange={(event) => setReminder(event.target.value ? Number(event.target.value) : '')} disabled={!dueDate} className="rounded border px-3 py-2 disabled:bg-gray-100">
            <option value="">No reminder</option>
            {reminderOptions.map((value) => (
              <option key={value} value={value}>{value} minutes before</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label key={tag.id} className="inline-flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={(event) => {
                    setSelectedTags(event.target.checked ? [...selectedTags, tag.id] : selectedTags.filter((id) => id !== tag.id));
                  }}
                />
                <span style={{ color: tag.color }}>{tag.name}</span>
              </label>
            ))}
          </div>
          <button className="rounded bg-teal-700 px-4 py-2 text-white">Add Todo</button>
        </form>

        {statusMessage ? <p className="mt-2 text-sm text-red-700">{statusMessage}</p> : null}

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or tags" className="rounded border px-3 py-2" />
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)} className="rounded border px-3 py-2">
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={tagFilter ?? ''} onChange={(event) => setTagFilter(event.target.value ? Number(event.target.value) : null)} className="rounded border px-3 py-2">
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportTodos} className="rounded border px-3 py-2 text-sm">Export</button>
          <label className="cursor-pointer rounded border px-3 py-2 text-sm">
            Import
            <input type="file" className="hidden" accept="application/json" onChange={importTodos} />
          </label>
          <button onClick={() => { setPriorityFilter('all'); setTagFilter(null); setQuery(''); }} className="rounded border px-3 py-2 text-sm">Clear Filters</button>
          <button onClick={requestPermission} className="rounded border px-3 py-2 text-sm">Enable Notifications ({permission})</button>
        </div>

        <form onSubmit={createTag} className="mt-4 flex gap-2">
          <input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="New tag" className="rounded border px-3 py-2" required />
          <input type="color" value={newTagColor} onChange={(event) => setNewTagColor(event.target.value)} className="h-10 w-14 rounded border" />
          <button className="rounded border px-3 py-2 text-sm">Create Tag</button>
        </form>
      </section>

      <section className="space-y-6">
        <TodoSection title="Overdue" todos={overdue} priorityClass={priorityClass} onToggle={toggleTodo} onDelete={deleteTodo} onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onSaveTemplate={saveTemplate} onTagFilter={setTagFilter} />
        <TodoSection title="Active" todos={active} priorityClass={priorityClass} onToggle={toggleTodo} onDelete={deleteTodo} onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onSaveTemplate={saveTemplate} onTagFilter={setTagFilter} />
        <TodoSection title="Completed" todos={completed} priorityClass={priorityClass} onToggle={toggleTodo} onDelete={deleteTodo} onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onSaveTemplate={saveTemplate} onTagFilter={setTagFilter} />
      </section>

      <section className="mt-8 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Templates</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded border p-3">
              <p className="font-medium">{template.name}</p>
              <p className="text-sm text-gray-600">{template.description || 'No description'}</p>
                <button onClick={() => void applyTemplate(template.id)} className="mt-2 rounded border px-3 py-1 text-sm">Use Template</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function TodoSection({
  title,
  todos,
  priorityClass,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onSaveTemplate,
  onTagFilter,
}: {
  title: string;
  todos: Todo[];
  priorityClass: (priority: Priority) => string;
  onToggle: (todo: Todo, completed: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onAddSubtask: (id: number) => Promise<void>;
  onToggleSubtask: (id: number, completed: boolean) => Promise<void>;
  onSaveTemplate: (todo: Todo) => Promise<void>;
  onTagFilter: (id: number | null) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">{title} ({todos.length})</h2>
      <div className="grid gap-3">
        {todos.length === 0 ? <p className="text-sm text-gray-600">No todos in this section.</p> : null}
        {todos.map((todo) => {
          const completedSubtasks = todo.subtasks.filter((subtask) => subtask.completed).length;
          const progress = todo.subtasks.length === 0 ? 0 : Math.round((completedSubtasks / todo.subtasks.length) * 100);

          return (
            <article key={todo.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <input type="checkbox" checked={Boolean(todo.completed)} onChange={(event) => void onToggle(todo, event.target.checked)} />
                <h3 className="font-semibold">{todo.title}</h3>
                <span className={`rounded px-2 py-1 text-xs ${priorityClass(todo.priority)}`}>{todo.priority}</span>
                {todo.is_recurring ? <span className="rounded bg-teal-100 px-2 py-1 text-xs text-teal-700">Repeat {todo.recurrence_pattern}</span> : null}
                {todo.reminder_minutes != null ? <span className="rounded bg-sky-100 px-2 py-1 text-xs text-sky-700">Reminder {todo.reminder_minutes}m</span> : null}
              </div>

              <p className="text-sm text-gray-700">{todo.description || 'No description'}</p>
              <p className="mt-1 text-xs text-gray-500">Due: {todo.due_date ? new Date(todo.due_date).toLocaleString() : 'No due date'}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                {todo.tags.map((tag) => (
                  <button key={tag.id} onClick={() => onTagFilter(tag.id)} className="rounded px-2 py-1 text-xs text-white" style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                  <span>{completedSubtasks}/{todo.subtasks.length} completed</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded bg-gray-200">
                  <div className={`h-2 rounded ${progress === 100 ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {todo.subtasks.map((subtask) => (
                  <label key={subtask.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={Boolean(subtask.completed)} onChange={(event) => void onToggleSubtask(subtask.id, event.target.checked)} />
                    <span>{subtask.title}</span>
                  </label>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <button onClick={() => void onAddSubtask(todo.id)} className="rounded border px-2 py-1">Add subtask</button>
                <button onClick={() => void onSaveTemplate(todo)} className="rounded border px-2 py-1">Save template</button>
                <button onClick={() => void onDelete(todo.id)} className="rounded border px-2 py-1 text-red-700">Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
