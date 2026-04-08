# PRP 05 - Subtasks and Progress Tracking

## Feature Overview
Allow todos to contain subtasks and show real-time completion progress in both text and bar form.

## User Stories
- As a user, I can add and remove subtasks for any todo.
- As a user, I can complete subtasks independently.
- As a user, I can track progress as completed versus total subtasks.

## User Flow
1. User expands Subtasks panel on a todo.
2. User adds one or more subtasks.
3. User toggles subtask completion states.
4. Progress display updates immediately.

## Technical Requirements
- Data model: subtasks table with todo_id foreign key and cascade delete.
- API routes:
  - POST /api/todos/[id]/subtasks
  - PUT /api/subtasks/[id]
  - DELETE /api/subtasks/[id]
- Progress formula: completed_count / total_count * 100.
- Subtask ordering should be stable by position or created order.

## UI Components
- Expand and collapse subtasks control
- Subtask input with add action
- Subtask list with completion checkbox and delete action
- Progress text and progress bar on todo row

## Edge Cases
- Empty subtask title should be rejected.
- Progress with zero subtasks should render safely.
- Deleting parent todo must remove all subtasks.
- Rapid toggles should not desynchronize progress state.

## Acceptance Criteria
- User can add unlimited subtasks.
- Subtasks can be completed and uncompleted.
- Progress updates without page refresh.
- Cascade delete behavior works for parent todo deletion.

## Testing Requirements
- E2E: add, toggle, and delete subtasks
- E2E: verify progress updates after each action
- E2E: delete todo and confirm subtasks removed
- Unit: progress calculation and percent rounding

## Out of Scope
- Nested subtasks
- Subtask-level reminders

## Success Metrics
- Progress display updates in under 100ms after subtask action.
- No orphaned subtasks after todo deletion.
- 100 percent pass rate on subtask CRUD tests.
