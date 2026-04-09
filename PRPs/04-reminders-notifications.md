# PRP 04: Reminders and Notifications

## Feature Overview
Implement browser notification reminders with configurable timing and duplicate prevention.

## Technical Requirements
- Fields: reminder_minutes, last_notification_sent.
- API: GET /api/notifications/check.
- Poll every 30 seconds in client hook.

## UI Requirements
- Notification permission button.
- Reminder selector with 7 options.
- Reminder badge shown on todos.

## Acceptance Criteria
- Notifications fire when due and only once per reminder cycle.
- Reminder requires due date.

## Testing Requirements
- E2E reminder setup and badge display.
- Manual browser permission verification.
