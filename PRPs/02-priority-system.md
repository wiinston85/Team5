# PRP 02 - Priority System

## Feature Overview
Introduce a three-level priority system (high, medium, low) that drives visual badges, sorting behavior, and filtering.

## User Stories
- As a user, I can assign a priority when creating or editing todos.
- As a user, I can quickly identify priority by color-coded badges.
- As a user, I can filter todos by priority.

## User Flow
1. User selects a priority in create or edit form.
2. Todo renders with a priority badge.
3. Todos are sorted by priority order.
4. User applies priority filter and list updates immediately.

## Technical Requirements
- Data model: add priority column on todos table with default medium.
- Types: Priority = high | medium | low.
- API validation must reject invalid priority values.
- Query and in-memory sort must use high > medium > low order.

## UI Components
- Priority dropdown in create form
- Priority dropdown in edit form
- Priority badge component on todo rows
- Priority filter dropdown in filter bar

## Edge Cases
- Missing priority input should default to medium.
- Unknown priority values from client should return validation error.
- Priority colors must remain readable in dark mode.

## Acceptance Criteria
- All three priority levels can be created and edited.
- Badge colors are distinct and consistent.
- Sort order respects priority first.
- Priority filter shows only matching todos.

## Testing Requirements
- E2E: create one todo for each priority
- E2E: edit priority value
- E2E: verify sorting order high to low
- E2E: filter by each priority
- Visual: confirm badge contrast in light and dark mode

## Out of Scope
- Custom user-defined priority levels
- User-configurable priority color palette

## Success Metrics
- Priority filter response updates under 100ms for common list sizes.
- No invalid priority values persisted.
- 100 percent pass rate for priority sorting tests.
