import Database from 'better-sqlite3';
import path from 'node:path';
import { addDays, addMonths, addWeeks, addYears, getSingaporeNow } from '@/lib/timezone';

export type Priority = 'high' | 'medium' | 'low';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface User {
  id: number;
  username: string;
  current_challenge: string | null;
  created_at: string;
}

export interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: number;
  position: number;
  created_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  completed: number;
  priority: Priority;
  due_date: string | null;
  is_recurring: number;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  subtasks?: Subtask[];
}

export interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  title: string;
  template_data: string;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  created_at: string;
}

const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  current_challenge TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authenticators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  reminder_minutes INTEGER,
  last_notification_sent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  title TEXT NOT NULL,
  template_data TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
`);

const getTodoStmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?');
const listTodoStmt = db.prepare("SELECT * FROM todos WHERE user_id = ? ORDER BY completed ASC, CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, due_date ASC, created_at DESC");
const listSubtasksStmt = db.prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC, id ASC');
const listTagsByTodoStmt = db.prepare(`
  SELECT tags.* FROM tags
  INNER JOIN todo_tags ON todo_tags.tag_id = tags.id
  WHERE todo_tags.todo_id = ?
  ORDER BY tags.name ASC
`);

export const userDB = {
  getByUsername(username: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  },
  getById(id: number): User | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  },
  create(username: string): User {
    const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
    return this.getById(Number(result.lastInsertRowid)) as User;
  },
  setChallenge(userId: number, challenge: string): void {
    db.prepare('UPDATE users SET current_challenge = ? WHERE id = ?').run(challenge, userId);
  },
  clearChallenge(userId: number): void {
    db.prepare('UPDATE users SET current_challenge = NULL WHERE id = ?').run(userId);
  },
};

export const authenticatorDB = {
  findByCredentialId(credentialId: string): Authenticator | undefined {
    return db.prepare('SELECT * FROM authenticators WHERE credential_id = ?').get(credentialId) as Authenticator | undefined;
  },
  listByUser(userId: number): Authenticator[] {
    return db.prepare('SELECT * FROM authenticators WHERE user_id = ?').all(userId) as Authenticator[];
  },
  create(input: Omit<Authenticator, 'id' | 'created_at'>): Authenticator {
    const result = db
      .prepare('INSERT INTO authenticators (user_id, credential_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)')
      .run(input.user_id, input.credential_id, input.public_key, input.counter, input.transports);
    return db.prepare('SELECT * FROM authenticators WHERE id = ?').get(Number(result.lastInsertRowid)) as Authenticator;
  },
  updateCounter(credentialId: string, counter: number): void {
    db.prepare('UPDATE authenticators SET counter = ? WHERE credential_id = ?').run(counter, credentialId);
  },
};

export const todoDB = {
  listByUser(userId: number): Todo[] {
    const todos = listTodoStmt.all(userId) as Todo[];
    return todos.map((todo) => ({
      ...todo,
      subtasks: listSubtasksStmt.all(todo.id) as Subtask[],
      tags: listTagsByTodoStmt.all(todo.id) as Tag[],
    }));
  },
  getById(userId: number, id: number): Todo | undefined {
    const todo = getTodoStmt.get(id, userId) as Todo | undefined;
    if (!todo) {
      return undefined;
    }
    return {
      ...todo,
      subtasks: listSubtasksStmt.all(todo.id) as Subtask[],
      tags: listTagsByTodoStmt.all(todo.id) as Tag[],
    };
  },
  create(input: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'completed'> & { user_id: number; completed?: number }): Todo {
    const now = getSingaporeNow().toISOString();
    const result = db
      .prepare(
        'INSERT INTO todos (user_id, title, description, completed, priority, due_date, is_recurring, recurrence_pattern, reminder_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        input.user_id,
        input.title,
        input.description ?? null,
        input.completed ?? 0,
        input.priority,
        input.due_date ?? null,
        input.is_recurring,
        input.recurrence_pattern ?? null,
        input.reminder_minutes ?? null,
        now,
        now,
      );
    return this.getById(input.user_id, Number(result.lastInsertRowid)) as Todo;
  },
  update(userId: number, id: number, updates: Partial<Todo>): Todo | undefined {
    const existing = this.getById(userId, id);
    if (!existing) {
      return undefined;
    }

    const next = {
      ...existing,
      ...updates,
      updated_at: getSingaporeNow().toISOString(),
    };

    db.prepare(
      'UPDATE todos SET title = ?, description = ?, completed = ?, priority = ?, due_date = ?, is_recurring = ?, recurrence_pattern = ?, reminder_minutes = ?, last_notification_sent = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    ).run(
      next.title,
      next.description ?? null,
      next.completed,
      next.priority,
      next.due_date ?? null,
      next.is_recurring,
      next.recurrence_pattern ?? null,
      next.reminder_minutes ?? null,
      next.last_notification_sent ?? null,
      next.updated_at,
      id,
      userId,
    );

    return this.getById(userId, id);
  },
  remove(userId: number, id: number): boolean {
    const result = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, userId);
    return result.changes > 0;
  },
  createNextRecurring(todo: Todo): Todo {
    const dueDate = todo.due_date ? new Date(todo.due_date) : getSingaporeNow();
    let nextDueDate = dueDate;
    if (todo.recurrence_pattern === 'daily') {
      nextDueDate = addDays(dueDate, 1);
    } else if (todo.recurrence_pattern === 'weekly') {
      nextDueDate = addWeeks(dueDate, 1);
    } else if (todo.recurrence_pattern === 'monthly') {
      nextDueDate = addMonths(dueDate, 1);
    } else if (todo.recurrence_pattern === 'yearly') {
      nextDueDate = addYears(dueDate, 1);
    }

    const newTodo = this.create({
      user_id: todo.user_id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: nextDueDate.toISOString(),
      is_recurring: todo.is_recurring,
      recurrence_pattern: todo.recurrence_pattern,
      reminder_minutes: todo.reminder_minutes,
      last_notification_sent: null,
      tags: [],
      subtasks: [],
    });

    for (const tag of todo.tags ?? []) {
      tagDB.assignToTodo(newTodo.id, tag.id);
    }

    return this.getById(todo.user_id, newTodo.id) as Todo;
  },
  listForReminders(userId: number): Todo[] {
    return this.listByUser(userId).filter((todo) => {
      if (todo.completed || !todo.due_date || todo.reminder_minutes == null) {
        return false;
      }
      if (todo.last_notification_sent) {
        return false;
      }
      const dueDate = new Date(todo.due_date);
      const reminderTime = dueDate.getTime() - todo.reminder_minutes * 60_000;
      return reminderTime <= getSingaporeNow().getTime();
    });
  },
};

export const subtaskDB = {
  getByIdForUser(id: number, userId: number): Subtask | undefined {
    return db
      .prepare(
        'SELECT s.* FROM subtasks s INNER JOIN todos t ON s.todo_id = t.id WHERE s.id = ? AND t.user_id = ?',
      )
      .get(id, userId) as Subtask | undefined;
  },
  create(todoId: number, title: string, position: number): Subtask {
    const result = db
      .prepare('INSERT INTO subtasks (todo_id, title, position) VALUES (?, ?, ?)')
      .run(todoId, title, position);
    return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(Number(result.lastInsertRowid)) as Subtask;
  },
  update(id: number, updates: Partial<Subtask>): Subtask | undefined {
    const existing = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask | undefined;
    if (!existing) {
      return undefined;
    }
    const next = { ...existing, ...updates };
    db.prepare('UPDATE subtasks SET title = ?, completed = ?, position = ? WHERE id = ?').run(next.title, next.completed, next.position, id);
    return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask;
  },
  remove(id: number): boolean {
    return db.prepare('DELETE FROM subtasks WHERE id = ?').run(id).changes > 0;
  },
};

export const tagDB = {
  getByIdForUser(userId: number, id: number): Tag | undefined {
    return db.prepare('SELECT * FROM tags WHERE user_id = ? AND id = ?').get(userId, id) as Tag | undefined;
  },
  listByUser(userId: number): Tag[] {
    return db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC').all(userId) as Tag[];
  },
  create(userId: number, name: string, color: string): Tag {
    const result = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(userId, name, color);
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(Number(result.lastInsertRowid)) as Tag;
  },
  update(userId: number, id: number, name: string, color: string): Tag | undefined {
    const changes = db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ? AND user_id = ?').run(name, color, id, userId).changes;
    if (!changes) {
      return undefined;
    }
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag;
  },
  remove(userId: number, id: number): boolean {
    return db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
  },
  assignToTodo(todoId: number, tagId: number): void {
    db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)').run(todoId, tagId);
  },
  removeFromTodo(todoId: number, tagId: number): void {
    db.prepare('DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?').run(todoId, tagId);
  },
};

export const templateDB = {
  listByUser(userId: number): Template[] {
    return db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Template[];
  },
  create(userId: number, payload: Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Template {
    const now = getSingaporeNow().toISOString();
    const result = db
      .prepare('INSERT INTO templates (user_id, name, description, category, title, template_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(userId, payload.name, payload.description ?? null, payload.category ?? null, payload.title, payload.template_data, now, now);
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(Number(result.lastInsertRowid)) as Template;
  },
  update(userId: number, id: number, payload: Partial<Template>): Template | undefined {
    const existing = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?').get(id, userId) as Template | undefined;
    if (!existing) {
      return undefined;
    }
    const next = { ...existing, ...payload, updated_at: getSingaporeNow().toISOString() };
    db.prepare('UPDATE templates SET name = ?, description = ?, category = ?, title = ?, template_data = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(next.name, next.description ?? null, next.category ?? null, next.title, next.template_data, next.updated_at, id, userId);
    return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Template;
  },
  remove(userId: number, id: number): boolean {
    return db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
  },
  getById(userId: number, id: number): Template | undefined {
    return db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?').get(id, userId) as Template | undefined;
  },
};

export const holidayDB = {
  listByYear(year: number): Holiday[] {
    return db.prepare('SELECT * FROM holidays WHERE date LIKE ? ORDER BY date ASC').all(`${year}-%`) as Holiday[];
  },
  upsert(date: string, name: string): void {
    db.prepare('INSERT INTO holidays (date, name) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET name = excluded.name').run(date, name);
  },
};

export const exportDB = {
  allByUser(userId: number) {
    const todos = todoDB.listByUser(userId);
    const tags = tagDB.listByUser(userId);
    const todoTags = db
      .prepare(
        'SELECT tt.* FROM todo_tags tt INNER JOIN todos t ON tt.todo_id = t.id WHERE t.user_id = ?',
      )
      .all(userId);
    const subtasks = db
      .prepare(
        'SELECT s.* FROM subtasks s INNER JOIN todos t ON s.todo_id = t.id WHERE t.user_id = ?',
      )
      .all(userId);

    return {
      version: 1,
      todos,
      tags,
      todoTags,
      subtasks,
    };
  },
};

export { db };
