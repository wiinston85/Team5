# PRP 06 - Tag System

## Feature Overview
Implement user-specific color tags with CRUD management and many-to-many todo assignment/filtering.

## User Stories
- As a user, I can create, edit, and delete tags.
- As a user, I can assign multiple tags to a todo.
- As a user, I can filter todos by a selected tag.

## User Flow
1. User opens Manage Tags modal and creates tags with name and color.
2. User selects tags while creating or editing a todo.
3. Todo rows render selected tags as colored pills.
4. User applies tag filter to narrow displayed todos.

## Technical Requirements
- Data model tables: tags, todo_tags.
- Tag names must be unique per user.
- API routes:
  - GET /api/tags
  - POST /api/tags
  - PUT /api/tags/[id]
  - DELETE /api/tags/[id]
  - POST /api/todos/[id]/tags
  - DELETE /api/todos/[id]/tags
- Deleting tag removes its association rows.

## UI Components
- Manage Tags modal with create, edit, delete actions
- Tag picker in create and edit todo forms
- Tag pill badges on todo cards
- Tag filter control and clear action

## Edge Cases
- Duplicate tag names per user must be blocked.
- Invalid color values must be rejected.
- Deleting tag should not delete todo records.
- Filter state should remain predictable when tag is deleted.

## Acceptance Criteria
- Tags are created, edited, and deleted correctly.
- Todos can hold multiple tags.
- Tag filter returns only matching todos.
- Tag edits are reflected on all linked todos.

## Testing Requirements
- E2E: tag CRUD flow
- E2E: assign and unassign tags to todos
- E2E: filter by tag
- Unit: uniqueness validation and color validation
- E2E: delete tag and verify associations removed

## Out of Scope
- Shared global tags between users
- Nested or hierarchical tagging

## Success Metrics
- Tag CRUD operations complete under 300ms average.
- Zero duplicate tag names per user in persisted data.
- 100 percent pass rate for tag assignment and filter tests.
