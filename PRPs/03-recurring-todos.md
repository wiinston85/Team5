# PRP 03 - Recurring Todos

## Feature Overview
Enable todos to recur on daily, weekly, monthly, or yearly schedules and automatically create the next instance when completed.

## User Stories
- As a user, I can mark a todo as recurring.
- As a user, I can select the recurrence pattern.
- As a user, completing a recurring todo automatically creates the next one.

## User Flow
1. User enables Repeat and picks a recurrence pattern.
2. User sets due date and creates todo.
3. User completes recurring todo.
4. System marks current todo completed and creates next occurrence.

## Technical Requirements
- Data model fields: is_recurring, recurrence_pattern.
- Allowed patterns: daily, weekly, monthly, yearly.
- Recurring todo requires due_date.
- On completion, create a new todo with next due date and inherited metadata.
- Date calculations must use Asia/Singapore timezone.

## UI Components
- Repeat checkbox in create and edit forms
- Recurrence pattern dropdown
- Recurring badge on todo rows

## Edge Cases
- Recurring todo without due date must be rejected.
- Monthly recurrence must handle short months safely.
- Leap-year transitions for yearly recurrence must be deterministic.
- Completing non-recurring todos must not create new todos.

## Acceptance Criteria
- All four recurrence patterns work.
- Completing recurring todo creates exactly one new instance.
- New instance inherits priority, tags, and reminder settings.
- New due date is correctly calculated in Singapore timezone.

## Testing Requirements
- E2E: create todos for each pattern
- E2E: complete recurring todo and verify new instance
- E2E: verify metadata inheritance
- Unit: due date computation for each pattern

## Out of Scope
- Custom recurrence intervals (for example every 3 days)
- Business-day-only recurrence logic

## Success Metrics
- Zero duplicate next-instance creations per completion.
- 100 percent pass rate on recurrence date calculation tests.
- Recurring completion latency below 500ms.
