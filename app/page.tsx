"use client";

import { useEffect, useMemo, useState } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { Tag, Template, Todo } from "@/types";

type ReminderOption = "" | "15" | "30" | "60" | "120" | "1440" | "2880" | "10080";

function reminderLabel(value: number | null): string | null {
  if (!value) return null;
  const map: Record<number, string> = {
    15: "15m",
    30: "30m",
    60: "1h",
    120: "2h",
    1440: "1d",
    2880: "2d",
    10080: "1w"
  };
  return map[value] || `${value}m`;
}

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [reminder, setReminder] = useState<ReminderOption>("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");

  useNotifications(notificationEnabled);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (tagFilter !== "all") params.set("tag", tagFilter);
    if (completionFilter !== "all") params.set("completion", completionFilter);
    return params.toString();
  }, [search, priorityFilter, tagFilter, completionFilter]);

  const load = async () => {
    const [todosRes, tagsRes, templatesRes] = await Promise.all([
      fetch(`/api/todos${query ? `?${query}` : ""}`),
      fetch("/api/tags"),
      fetch("/api/templates")
    ]);

    if (todosRes.status === 401) {
      window.location.href = "/login";
      return;
    }

    const todosJson = await todosRes.json();
    const tagsJson = await tagsRes.json();
    const templatesJson = await templatesRes.json();
    setTodos(todosJson.todos || []);
    setTags(tagsJson.tags || []);
    setTemplates(templatesJson.templates || []);
  };

  useEffect(() => {
    void load();
  }, [query]);

  const createTodo = async () => {
    await fetch("/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        priority,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        reminder_minutes: reminder ? Number(reminder) : null,
        tag_ids: selectedTags
      })
    });
    setTitle("");
    setDueDate("");
    setReminder("");
    setIsRecurring(false);
    setSelectedTags([]);
    await load();
  };

  const toggleTodo = async (todo: Todo) => {
    await fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ completed: todo.completed === 0 })
    });
    await load();
  };

  const deleteTodo = async (todoId: number) => {
    await fetch(`/api/todos/${todoId}`, { method: "DELETE" });
    await load();
  };

  const addSubtask = async (todoId: number, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;
    await fetch(`/api/todos/${todoId}/subtasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: subtaskTitle })
    });
    await load();
  };

  const updateSubtask = async (subtaskId: number, payload: { completed?: boolean; title?: string }) => {
    await fetch(`/api/subtasks/${subtaskId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    await load();
  };

  const deleteSubtask = async (subtaskId: number) => {
    await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
    await load();
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    await fetch("/api/tags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newTagName, color: newTagColor })
    });
    setNewTagName("");
    await load();
  };

  const saveTemplate = async () => {
    if (!title.trim()) return;
    const name = window.prompt("Template name");
    if (!name) return;
    await fetch("/api/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        title_template: title,
        priority,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        reminder_minutes: reminder ? Number(reminder) : null
      })
    });
    await load();
  };

  const useTemplate = async (templateId: number) => {
    await fetch(`/api/templates/${templateId}/use`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ due_date: dueDate || null })
    });
    await load();
  };

  const exportData = (format: "json" | "csv") => {
    window.location.href = `/api/todos/export?format=${format}`;
  };

  const importData = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    await fetch("/api/todos/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed)
    });
    await load();
  };

  const enableNotifications = async () => {
    const result = await Notification.requestPermission();
    setNotificationEnabled(result === "granted");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const overdue = todos.filter((t) => t.completed === 0 && t.due_date && new Date(t.due_date).getTime() < Date.now());
  const pending = todos.filter((t) => t.completed === 0 && (!t.due_date || new Date(t.due_date).getTime() >= Date.now()));
  const completed = todos.filter((t) => t.completed === 1);

  return (
    <main>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h1>Todo App</h1>
        <div className="row">
          <a href="/calendar"><button>Calendar</button></a>
          <button onClick={enableNotifications}>{notificationEnabled ? "Notifications On" : "Enable Notifications"}</button>
          <button onClick={() => exportData("json")}>Export JSON</button>
          <button onClick={() => exportData("csv")}>Export CSV</button>
          <label>
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importData(file);
              }}
            />
            <button>Import</button>
          </label>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 12 }}>
        <h2>Create Todo</h2>
        <div className="row">
          <input placeholder="Todo title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 2 }} />
          <select value={priority} onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low") }>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <select value={reminder} onChange={(e) => setReminder(e.target.value as ReminderOption)} disabled={!dueDate}>
            <option value="">Reminder</option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="1440">1 day</option>
            <option value="2880">2 days</option>
            <option value="10080">1 week</option>
          </select>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <label>
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} /> Repeat
          </label>
          {isRecurring ? (
            <select value={recurrencePattern} onChange={(e) => setRecurrencePattern(e.target.value as "daily" | "weekly" | "monthly" | "yearly") }>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          ) : null}

          {tags.map((tag) => (
            <label key={tag.id} className="small" style={{ border: `1px solid ${tag.color}`, borderRadius: 999, padding: "4px 8px" }}>
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={(e) => {
                  setSelectedTags((prev) =>
                    e.target.checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id)
                  );
                }}
              />
              {tag.name}
            </label>
          ))}
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <button className="primary" onClick={createTodo} disabled={!title.trim()}>Add</button>
          <button onClick={saveTemplate} disabled={!title.trim()}>Save as Template</button>
          <select defaultValue="" onChange={(e) => e.target.value && void useTemplate(Number(e.target.value))}>
            <option value="">Use Template</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>{tpl.name}{tpl.category ? ` (${tpl.category})` : ""}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h2>Search & Filters</h2>
        <div className="row">
          <input placeholder="Search todos and subtasks..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="all">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          <select value={completionFilter} onChange={(e) => setCompletionFilter(e.target.value)}>
            <option value="all">All Todos</option>
            <option value="incomplete">Incomplete</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => { setSearch(""); setPriorityFilter("all"); setTagFilter("all"); setCompletionFilter("all"); }}>Clear All</button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 12 }}>
        <h2>Manage Tags</h2>
        <div className="row">
          <input placeholder="Tag name" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
          <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} />
          <button onClick={createTag}>Create Tag</button>
        </div>
      </section>

      {[{ title: `Overdue (${overdue.length})`, list: overdue }, { title: `Pending (${pending.length})`, list: pending }, { title: `Completed (${completed.length})`, list: completed }].map(({ title: sectionTitle, list }) => (
        <section key={sectionTitle}>
          <h3 className="section-title">{sectionTitle}</h3>
          {list.length === 0 ? <p className="small">No todos in this section.</p> : null}
          {list.map((todo) => {
            const completedCount = todo.subtasks.filter((s) => s.completed === 1).length;
            const progress = todo.subtasks.length ? Math.round((completedCount / todo.subtasks.length) * 100) : 0;
            return (
              <div key={todo.id} className="card todo">
                <input type="checkbox" checked={todo.completed === 1} onChange={() => void toggleTodo(todo)} />
                <div>
                  <div style={{ fontWeight: 600 }}>{todo.title}</div>
                  <div style={{ margin: "4px 0" }}>
                    <span className={`badge ${todo.priority}`}>{todo.priority}</span>
                    {todo.is_recurring ? <span className="badge recurring">recurring {todo.recurrence_pattern}</span> : null}
                    {todo.reminder_minutes ? <span className="badge reminder">bell {reminderLabel(todo.reminder_minutes)}</span> : null}
                    {todo.tags.map((tag) => (
                      <span key={tag.id} className="badge" style={{ background: tag.color }}>{tag.name}</span>
                    ))}
                  </div>
                  <div className="small">Due: {todo.due_date ? new Date(todo.due_date).toLocaleString("en-SG", { timeZone: "Asia/Singapore" }) : "No due date"}</div>

                  <details style={{ marginTop: 8 }}>
                    <summary>Subtasks ({completedCount}/{todo.subtasks.length})</summary>
                    <div className="small" style={{ marginTop: 6 }}>
                      <div style={{ width: 240, border: "1px solid #d1d5db", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: 8, background: progress === 100 ? "#16a34a" : "#2563eb" }} />
                      </div>
                    </div>
                    <SubtaskManager todo={todo} onAdd={addSubtask} onUpdate={updateSubtask} onDelete={deleteSubtask} />
                  </details>
                </div>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="danger" onClick={() => void deleteTodo(todo.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </main>
  );
}

function SubtaskManager({
  todo,
  onAdd,
  onUpdate,
  onDelete
}: {
  todo: Todo;
  onAdd: (todoId: number, title: string) => Promise<void>;
  onUpdate: (subtaskId: number, payload: { completed?: boolean; title?: string }) => Promise<void>;
  onDelete: (subtaskId: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div style={{ marginTop: 8 }}>
      {todo.subtasks.map((subtask) => (
        <div key={subtask.id} className="row" style={{ marginTop: 6 }}>
          <input
            type="checkbox"
            checked={subtask.completed === 1}
            onChange={() => void onUpdate(subtask.id, { completed: subtask.completed === 0 })}
          />
          <input
            value={subtask.title}
            onChange={(e) => void onUpdate(subtask.id, { title: e.target.value })}
            style={{ flex: 1 }}
          />
          <button onClick={() => void onDelete(subtask.id)}>Delete</button>
        </div>
      ))}
      <div className="row" style={{ marginTop: 6 }}>
        <input
          placeholder="New subtask"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              void onAdd(todo.id, draft.trim());
              setDraft("");
            }
          }}
          style={{ flex: 1 }}
        />
        <button
          onClick={() => {
            if (!draft.trim()) return;
            void onAdd(todo.id, draft.trim());
            setDraft("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
