# PRP 01: Todo CRUD Operations

## Feature Overview
Implement create, read, update, and delete operations for todos with Singapore timezone validation and optimistic UI behavior.

## Technical Requirements
- Database table: todos with title, description, completed, due date, priority, recurring fields, reminder fields.
- API routes:
  - POST /api/todos
  - GET /api/todos
  - GET /api/todos/[id]
  - PUT /api/todos/[id]
  - DELETE /api/todos/[id]
- Validate title as non-empty trimmed text.
- Validate due date is at least 1 minute in the future.

## UI Requirements
- Todo creation form with title and metadata.
- Display sections: Overdue, Active, Completed.
- Completion toggle, edit support through PUT, delete button with confirmation.

## Acceptance Criteria
- Can create a title-only todo.
- Can create with metadata.
- Completion moves todo to Completed section.
- Cascade delete removes subtasks and tag links.

## Testing Requirements
- E2E: create, edit, toggle, delete, and past due date validation.
