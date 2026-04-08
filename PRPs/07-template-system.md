# PRP 07 - Template System

## Feature Overview
Allow users to save common todo configurations as reusable templates and create new todos from those templates.

## User Stories
- As a user, I can save form settings as a template.
- As a user, I can create todos quickly from templates.
- As a user, I can manage and delete old templates.

## User Flow
1. User fills todo form and selects Save as Template.
2. User enters template metadata (name, description, category).
3. Template appears in template list and quick selector.
4. User chooses template and system creates a new todo with saved settings.

## Technical Requirements
- Data model: templates table.
- API routes:
  - GET /api/templates
  - POST /api/templates
  - PUT /api/templates/[id]
  - DELETE /api/templates/[id]
  - POST /api/templates/[id]/use
- Template payload includes title, priority, recurrence settings, reminder settings, and optional metadata.
- Subtasks can be serialized and restored where supported.

## UI Components
- Save as Template button
- Save Template modal
- Template manager modal
- Template dropdown or list for quick use

## Edge Cases
- Template name is required and should be validated.
- Deleting template must not alter existing todos created from it.
- Invalid template payload should fail with clear validation errors.
- Using template without optional fields should still create valid todo.

## Acceptance Criteria
- User can create and manage templates.
- Template use creates todo with expected settings.
- Template deletion does not impact existing todos.
- Optional category and description are persisted correctly.

## Testing Requirements
- E2E: save template from todo form
- E2E: use template to create new todo
- E2E: edit and delete template
- Unit: template serialization and deserialization paths
- E2E: verify template-derived todo settings

## Out of Scope
- Organization-wide shared templates
- Template version history

## Success Metrics
- Template create and use actions complete under 500ms.
- Zero data-loss issues on template roundtrip.
- 100 percent pass rate in template lifecycle tests.
