# PRP 03: Recurring Todos

## Feature Overview
Support recurring schedules and automatic next-instance creation when a recurring todo is completed.

## Technical Requirements
- Recurrence pattern type: daily | weekly | monthly | yearly.
- Recurring todo requires due date and pattern.
- On completion, create next todo instance with inherited metadata.

## UI Requirements
- Recurring checkbox and recurrence pattern selector.
- Recurring badge on todo card.

## Acceptance Criteria
- All four recurrence patterns create correct next due date.
- Priority, reminder, and tag metadata are inherited.

## Testing Requirements
- E2E recurring creation and completion.
- Unit tests for date calculations.
