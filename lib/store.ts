import fs from "node:fs";
import path from "node:path";
import type { RecurrencePattern, Tag, Template, Todo, Subtask, Priority } from "@/types";

export interface UserRecord {
  id: number;
  username: string;
  created_at: string;
}

export interface AuthenticatorRecord {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string;
  created_at: string;
}

interface TodoRecord {
  id: number;
  user_id: number;
  title: string;
  completed: number;
  due_date: string | null;
  priority: Priority;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

interface HolidayRecord {
  id: number;
  date: string;
  name: string;
}

interface TodoTagRecord {
  todo_id: number;
  tag_id: number;
}

interface DataStore {
  counters: Record<string, number>;
  users: UserRecord[];
  authenticators: AuthenticatorRecord[];
  todos: TodoRecord[];
  subtasks: Subtask[];
  tags: Tag[];
  todo_tags: TodoTagRecord[];
  templates: Template[];
  holidays: HolidayRecord[];
}

const dbPath = path.join(process.cwd(), "data.json");

function nowIso(): string {
  return new Date().toISOString();
}

function seed(): DataStore {
  return {
    counters: {
      users: 1,
      authenticators: 1,
      todos: 1,
      subtasks: 1,
      tags: 1,
      templates: 1,
      holidays: 6
    },
    users: [],
    authenticators: [],
    todos: [],
    subtasks: [],
    tags: [],
    todo_tags: [],
    templates: [],
    holidays: [
      { id: 1, date: "2026-01-01", name: "New Year's Day" },
      { id: 2, date: "2026-02-17", name: "Chinese New Year" },
      { id: 3, date: "2026-05-01", name: "Labour Day" },
      { id: 4, date: "2026-08-09", name: "National Day" },
      { id: 5, date: "2026-12-25", name: "Christmas Day" }
    ]
  };
}

function load(): DataStore {
  if (!fs.existsSync(dbPath)) {
    const initial = seed();
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }

  const parsed = JSON.parse(fs.readFileSync(dbPath, "utf8")) as DataStore;
  return parsed;
}

function save(data: DataStore): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function nextId(data: DataStore, key: keyof DataStore["counters"]): number {
  const value = data.counters[key];
  data.counters[key] += 1;
  return value;
}

export function initDb(): void {
  load();
}

export function getUserByUsername(username: string): UserRecord | undefined {
  return load().users.find((user) => user.username === username);
}

export function createUser(username: string): UserRecord {
  const data = load();
  const user: UserRecord = { id: nextId(data, "users"), username, created_at: nowIso() };
  data.users.push(user);
  save(data);
  return user;
}

export function getAuthenticatorsByUser(userId: number): AuthenticatorRecord[] {
  return load().authenticators.filter((record) => record.user_id === userId);
}

export function getAuthenticatorByUserAndCredential(userId: number, credentialId: string): AuthenticatorRecord | undefined {
  return load().authenticators.find((record) => record.user_id === userId && record.credential_id === credentialId);
}

export function addAuthenticator(record: Omit<AuthenticatorRecord, "id" | "created_at">): AuthenticatorRecord {
  const data = load();
  const auth: AuthenticatorRecord = { ...record, id: nextId(data, "authenticators"), created_at: nowIso() };
  if (!data.authenticators.some((item) => item.credential_id === auth.credential_id)) {
    data.authenticators.push(auth);
    save(data);
  }
  return auth;
}

export function updateAuthenticatorCounter(id: number, counter: number): void {
  const data = load();
  const auth = data.authenticators.find((record) => record.id === id);
  if (auth) {
    auth.counter = counter;
    save(data);
  }
}

function buildTodo(data: DataStore, todo: TodoRecord): Todo {
  const tags = data.todo_tags
    .filter((rel) => rel.todo_id === todo.id)
    .map((rel) => data.tags.find((tag) => tag.id === rel.tag_id))
    .filter((tag): tag is Tag => Boolean(tag));

  const subtasks = data.subtasks
    .filter((subtask) => subtask.todo_id === todo.id)
    .sort((a, b) => a.position - b.position || a.id - b.id);

  return { ...todo, tags, subtasks };
}

export function listTodos(userId: number): Todo[] {
  const data = load();
  return data.todos.filter((todo) => todo.user_id === userId).map((todo) => buildTodo(data, todo));
}

export function getTodo(userId: number, todoId: number): Todo | undefined {
  const data = load();
  const todo = data.todos.find((row) => row.user_id === userId && row.id === todoId);
  return todo ? buildTodo(data, todo) : undefined;
}

export function getTodoById(todoId: number): Todo | undefined {
  const data = load();
  const todo = data.todos.find((row) => row.id === todoId);
  return todo ? buildTodo(data, todo) : undefined;
}

export function createTodo(input: Omit<TodoRecord, "id" | "created_at" | "updated_at" | "last_notification_sent"> & { last_notification_sent?: string | null; tag_ids?: number[] }): TodoRecord {
  const data = load();
  const todo: TodoRecord = {
    ...input,
    id: nextId(data, "todos"),
    created_at: nowIso(),
    updated_at: nowIso(),
    last_notification_sent: input.last_notification_sent ?? null
  };
  data.todos.push(todo);
  for (const tagId of input.tag_ids || []) {
    if (!data.todo_tags.some((rel) => rel.todo_id === todo.id && rel.tag_id === tagId)) {
      data.todo_tags.push({ todo_id: todo.id, tag_id: tagId });
    }
  }
  save(data);
  return todo;
}

export function updateTodo(userId: number, todoId: number, patch: Partial<Omit<TodoRecord, "id" | "user_id" | "created_at">> & { tag_ids?: number[] }): TodoRecord | undefined {
  const data = load();
  const todo = data.todos.find((row) => row.user_id === userId && row.id === todoId);
  if (!todo) return undefined;
  Object.assign(todo, patch, { updated_at: nowIso() });
  if (patch.tag_ids) {
    data.todo_tags = data.todo_tags.filter((rel) => rel.todo_id !== todoId);
    for (const tagId of patch.tag_ids) data.todo_tags.push({ todo_id: todoId, tag_id: tagId });
  }
  save(data);
  return todo;
}

export function deleteTodo(userId: number, todoId: number): boolean {
  const data = load();
  const before = data.todos.length;
  data.todos = data.todos.filter((todo) => !(todo.user_id === userId && todo.id === todoId));
  if (data.todos.length === before) return false;
  data.subtasks = data.subtasks.filter((subtask) => subtask.todo_id !== todoId);
  data.todo_tags = data.todo_tags.filter((rel) => rel.todo_id !== todoId);
  save(data);
  return true;
}

export function getTodoTagIds(todoId: number): number[] {
  return load().todo_tags.filter((rel) => rel.todo_id === todoId).map((rel) => rel.tag_id);
}

export function replaceTodoTags(userId: number, todoId: number, tagIds: number[]): boolean {
  const data = load();
  const todo = data.todos.find((row) => row.user_id === userId && row.id === todoId);
  if (!todo) return false;
  data.todo_tags = data.todo_tags.filter((rel) => rel.todo_id !== todoId);
  for (const tagId of tagIds) data.todo_tags.push({ todo_id: todoId, tag_id: tagId });
  save(data);
  return true;
}

export function removeTodoTag(userId: number, todoId: number, tagId: number): boolean {
  const data = load();
  const todo = data.todos.find((row) => row.user_id === userId && row.id === todoId);
  if (!todo) return false;
  data.todo_tags = data.todo_tags.filter((rel) => !(rel.todo_id === todoId && rel.tag_id === tagId));
  save(data);
  return true;
}

export function createSubtask(todoId: number, title: string): Subtask {
  const data = load();
  const maxPosition = data.subtasks.filter((subtask) => subtask.todo_id === todoId).reduce((max, subtask) => Math.max(max, subtask.position), -1);
  const subtask: Subtask = {
    id: nextId(data, "subtasks"),
    todo_id: todoId,
    title,
    completed: 0,
    position: maxPosition + 1,
    created_at: nowIso()
  };
  data.subtasks.push(subtask);
  save(data);
  return subtask;
}

export function getSubtaskForUser(userId: number, subtaskId: number): Subtask | undefined {
  const data = load();
  const subtask = data.subtasks.find((row) => row.id === subtaskId);
  if (!subtask) return undefined;
  const todo = data.todos.find((row) => row.id === subtask.todo_id && row.user_id === userId);
  return todo ? subtask : undefined;
}

export function updateSubtask(subtaskId: number, patch: Partial<Pick<Subtask, "title" | "completed">>): Subtask | undefined {
  const data = load();
  const subtask = data.subtasks.find((row) => row.id === subtaskId);
  if (!subtask) return undefined;
  Object.assign(subtask, patch);
  save(data);
  return subtask;
}

export function deleteSubtask(subtaskId: number): void {
  const data = load();
  data.subtasks = data.subtasks.filter((row) => row.id !== subtaskId);
  save(data);
}

export function listTags(userId: number): Tag[] {
  return load().tags.filter((tag) => tag.user_id === userId).sort((a, b) => a.name.localeCompare(b.name));
}

export function getTagByName(userId: number, name: string): Tag | undefined {
  return load().tags.find((tag) => tag.user_id === userId && tag.name === name);
}

export function createTag(userId: number, name: string, color: string): Tag {
  const data = load();
  if (data.tags.some((tag) => tag.user_id === userId && tag.name === name)) {
    throw new Error("Tag name must be unique");
  }
  const tag: Tag = { id: nextId(data, "tags"), user_id: userId, name, color, created_at: nowIso() };
  data.tags.push(tag);
  save(data);
  return tag;
}

export function updateTag(userId: number, tagId: number, name: string, color: string): boolean {
  const data = load();
  if (data.tags.some((tag) => tag.user_id === userId && tag.name === name && tag.id !== tagId)) {
    throw new Error("Tag name must be unique");
  }
  const tag = data.tags.find((row) => row.user_id === userId && row.id === tagId);
  if (!tag) return false;
  tag.name = name;
  tag.color = color;
  save(data);
  return true;
}

export function deleteTag(userId: number, tagId: number): boolean {
  const data = load();
  const before = data.tags.length;
  data.tags = data.tags.filter((tag) => !(tag.user_id === userId && tag.id === tagId));
  if (before === data.tags.length) return false;
  data.todo_tags = data.todo_tags.filter((rel) => rel.tag_id !== tagId);
  save(data);
  return true;
}

export function listTemplates(userId: number): Template[] {
  return load().templates.filter((template) => template.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getTemplate(userId: number, templateId: number): Template | undefined {
  return load().templates.find((template) => template.user_id === userId && template.id === templateId);
}

export function createTemplate(input: Omit<Template, "id" | "created_at">): Template {
  const data = load();
  const template: Template = { ...input, id: nextId(data, "templates"), created_at: nowIso() };
  data.templates.push(template);
  save(data);
  return template;
}

export function updateTemplate(userId: number, templateId: number, patch: Partial<Omit<Template, "id" | "user_id" | "created_at">>): boolean {
  const data = load();
  const template = data.templates.find((row) => row.user_id === userId && row.id === templateId);
  if (!template) return false;
  Object.assign(template, patch);
  save(data);
  return true;
}

export function deleteTemplate(userId: number, templateId: number): boolean {
  const data = load();
  const before = data.templates.length;
  data.templates = data.templates.filter((template) => !(template.user_id === userId && template.id === templateId));
  if (before === data.templates.length) return false;
  save(data);
  return true;
}

export function listHolidays(): HolidayRecord[] {
  return load().holidays.sort((a, b) => a.date.localeCompare(b.date));
}

export function listPendingNotifications(userId: number): Array<{ id: number; title: string; due_date: string }> {
  const data = load();
  const now = Date.now();
  const due = data.todos.filter((todo) => {
    if (todo.user_id !== userId || todo.completed !== 0 || !todo.due_date || todo.reminder_minutes == null || todo.last_notification_sent) {
      return false;
    }
    const notifyAt = new Date(todo.due_date).getTime() - todo.reminder_minutes * 60_000;
    return notifyAt <= now;
  });
  for (const todo of due) todo.last_notification_sent = nowIso();
  if (due.length > 0) save(data);
  return due.map((todo) => ({ id: todo.id, title: todo.title, due_date: todo.due_date as string }));
}

export function exportForUser(userId: number) {
  const data = load();
  const todos = data.todos.filter((todo) => todo.user_id === userId);
  const todoIds = new Set(todos.map((todo) => todo.id));
  const subtasks = data.subtasks.filter((subtask) => todoIds.has(subtask.todo_id));
  const todo_tags = data.todo_tags.filter((rel) => todoIds.has(rel.todo_id));
  const tagIds = new Set(todo_tags.map((rel) => rel.tag_id));
  const tags = data.tags.filter((tag) => tag.user_id === userId || tagIds.has(tag.id));
  return { version: "1.0", exported_at: nowIso(), todos, subtasks, tags, todo_tags };
}

export function importForUser(userId: number, payload: {
  tags?: Array<Record<string, unknown>>;
  todos: Array<Record<string, unknown>>;
  subtasks?: Array<Record<string, unknown>>;
  todo_tags?: Array<{ todo_id: number; tag_id: number }>;
}): number {
  const data = load();
  const tagIdMap = new Map<number, number>();
  const todoIdMap = new Map<number, number>();

  for (const tag of payload.tags || []) {
    const name = String(tag.name || "").trim();
    if (!name) continue;
    const existing = data.tags.find((row) => row.user_id === userId && row.name === name);
    if (existing) {
      tagIdMap.set(Number(tag.id || 0), existing.id);
    } else {
      const created: Tag = {
        id: nextId(data, "tags"),
        user_id: userId,
        name,
        color: String(tag.color || "#3B82F6"),
        created_at: nowIso()
      };
      data.tags.push(created);
      tagIdMap.set(Number(tag.id || 0), created.id);
    }
  }

  for (const todo of payload.todos) {
    const created: TodoRecord = {
      id: nextId(data, "todos"),
      user_id: userId,
      title: String(todo.title || "Imported Todo"),
      completed: Number(todo.completed || 0),
      due_date: todo.due_date ? String(todo.due_date) : null,
      priority: ["high", "medium", "low"].includes(String(todo.priority)) ? (String(todo.priority) as Priority) : "medium",
      is_recurring: Number(todo.is_recurring || 0),
      recurrence_pattern: todo.recurrence_pattern ? (String(todo.recurrence_pattern) as RecurrencePattern) : null,
      reminder_minutes: todo.reminder_minutes ? Number(todo.reminder_minutes) : null,
      last_notification_sent: null,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    data.todos.push(created);
    todoIdMap.set(Number(todo.id || 0), created.id);
  }

  for (const subtask of payload.subtasks || []) {
    const mappedTodoId = todoIdMap.get(Number(subtask.todo_id || 0));
    if (!mappedTodoId) continue;
    data.subtasks.push({
      id: nextId(data, "subtasks"),
      todo_id: mappedTodoId,
      title: String(subtask.title || "Imported Subtask"),
      completed: Number(subtask.completed || 0),
      position: Number(subtask.position || 0),
      created_at: nowIso()
    });
  }

  for (const rel of payload.todo_tags || []) {
    const mappedTodoId = todoIdMap.get(Number(rel.todo_id));
    const mappedTagId = tagIdMap.get(Number(rel.tag_id));
    if (mappedTodoId && mappedTagId && !data.todo_tags.some((row) => row.todo_id === mappedTodoId && row.tag_id === mappedTagId)) {
      data.todo_tags.push({ todo_id: mappedTodoId, tag_id: mappedTagId });
    }
  }

  save(data);
  return todoIdMap.size;
}
