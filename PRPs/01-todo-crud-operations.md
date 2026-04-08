# PRP 01 - Todo CRUD Operations

## Feature Overview
Implement full todo create, read, update, and delete capabilities with Singapore timezone date validation and section-based rendering (Overdue, Pending, Completed).

## User Stories
- As a user, I can create a todo with a required title.
- As a user, I can optionally set due date and priority.
- As a user, I can edit and delete existing todos.
- As a user, I can mark todos complete and incomplete.

## User Flow
1. User enters title and optional metadata in the create form.
2. User submits the form and sees the new todo immediately.
3. User can toggle completion, edit fields, or delete the todo.
4. UI re-groups todos into Overdue, Pending, and Completed sections.

## Technical Requirements
- Data model: todos table with id, user_id, title, completed, due_date, priority, created_at, updated_at.
- API routes:
  - POST /api/todos
  - GET /api/todos
  - GET /api/todos/[id]
  - PUT /api/todos/[id]
  - DELETE /api/todos/[id]
- Validation:
  - title must be non-empty after trimming
  - due date must be at least 1 minute in the future (Asia/Singapore)
- Sorting: priority (high, medium, low), then due date, then creation date.

## UI Components
- Todo create form (title, priority select, datetime input, add button)
- Todo list grouped by section headers and counters
- Todo row with completion checkbox, edit action, delete action
- Edit modal or inline edit form

## Edge Cases
- Empty or whitespace-only title should be rejected.
- Past due dates should be rejected.
- No due date should place todo in Pending section.
- Deleting a todo should cascade related subtasks and tag links.

## Acceptance Criteria
- Can create todo with only a title.
- Can create and edit todo metadata.
- Completed todos move to Completed section.
- Overdue logic is accurate in Singapore timezone.
- Delete removes todo and related linked data.

## Testing Requirements
- E2E: create todo with title only
- E2E: create todo with full metadata
- E2E: edit todo fields
- E2E: toggle completion status
- E2E: delete todo
- E2E: reject invalid due date

## Out of Scope
- Calendar month rendering
- Template creation workflows
- Export and import behavior

## Success Metrics
- 100 percent CRUD route pass rate in E2E suite.
- Section grouping accuracy for all todo states.
- Zero invalid due-date records persisted.
