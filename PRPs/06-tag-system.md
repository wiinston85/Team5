# PRP 06: Tag System

## Feature Overview
Provide user-scoped colored tags with assignment to todos and filtering.

## Technical Requirements
- Tables: tags and todo_tags.
- APIs:
  - GET/POST /api/tags
  - PUT/DELETE /api/tags/[id]
  - POST/DELETE /api/todos/[id]/tags
- Unique constraint: tag name per user.

## UI Requirements
- Tag creation form with color picker.
- Tag badges on todo cards.
- Filter by clicking tag badge.

## Acceptance Criteria
- Tag CRUD works.
- Assign/remove tags works.
- Tag filtering works.

## Testing Requirements
- E2E tag creation/edit/delete and filtering.
