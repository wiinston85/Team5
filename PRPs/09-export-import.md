# PRP 09: Export and Import

## Feature Overview
Provide backup and restore for todos, subtasks, and tags through JSON.

## Technical Requirements
- APIs:
  - GET /api/todos/export
  - POST /api/todos/import
- Include version and relationship data.
- Validate import payload.
- Reuse existing tags by name to avoid duplicates.

## UI Requirements
- Export button for JSON download.
- Import file input for JSON upload.

## Acceptance Criteria
- Export output is valid JSON.
- Import restores records and relationships.
- Invalid imports return clear error.

## Testing Requirements
- E2E export/import success and invalid file behavior.
