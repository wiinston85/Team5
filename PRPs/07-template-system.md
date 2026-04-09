# PRP 07: Template System

## Feature Overview
Save reusable todo configurations as templates and instantiate new todos from templates.

## Technical Requirements
- Templates table with serialized template_data.
- APIs:
  - GET/POST /api/templates
  - PUT/DELETE /api/templates/[id]
  - POST /api/templates/[id]/use

## UI Requirements
- Save as template action on a todo.
- Template list with use action.

## Acceptance Criteria
- Template includes relevant metadata and subtasks.
- Using template creates a new todo with expected fields.

## Testing Requirements
- E2E save/use/edit/delete template flow.
