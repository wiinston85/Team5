# PRP 05: Subtasks and Progress

## Feature Overview
Allow todos to contain subtasks and display real-time progress.

## Technical Requirements
- Subtasks table with ON DELETE CASCADE from todos.
- APIs:
  - POST /api/todos/[id]/subtasks
  - PUT /api/subtasks/[id]
  - DELETE /api/subtasks/[id]

## UI Requirements
- Add subtask action.
- Toggle completion per subtask.
- Progress bar and X/Y completed label.

## Acceptance Criteria
- Unlimited subtasks can be added.
- Progress updates immediately.
- Deleting a todo removes subtasks automatically.

## Testing Requirements
- E2E subtask CRUD and progress behavior.
