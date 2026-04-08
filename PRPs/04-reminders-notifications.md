# PRP 04 - Reminders and Notifications

## Feature Overview
Provide browser reminders before due dates with configurable timing and one-time notification safeguards.

## User Stories
- As a user, I can enable browser notifications for reminders.
- As a user, I can select when a reminder should trigger.
- As a user, I receive reminder notifications at the expected time.

## User Flow
1. User enables notifications and grants browser permission.
2. User creates or edits todo with due date and reminder timing.
3. Background polling checks reminder eligibility.
4. System sends one notification when reminder threshold is reached.

## Technical Requirements
- Data model fields: reminder_minutes, last_notification_sent.
- API route: GET /api/notifications/check.
- Reminder options: 15m, 30m, 1h, 2h, 1d, 2d, 1w.
- Reminder requires due date.
- Polling checks reminder state at fixed interval.
- Prevent duplicate notifications using last_notification_sent.

## UI Components
- Enable Notifications button with permission state
- Reminder dropdown in create and edit form
- Reminder badge on todo row with abbreviated timing

## Edge Cases
- Browser permission denied should not break todo workflows.
- Reminder selection without due date should be disabled or rejected.
- Timezone calculations must remain correct for Singapore local time.
- Polling race conditions should not send duplicate notifications.

## Acceptance Criteria
- User can enable notifications when browser supports it.
- All reminder timing options are selectable.
- Notifications trigger at correct reminder time.
- Same reminder is never sent more than once.

## Testing Requirements
- Manual: permission grant and deny paths
- E2E: set reminder and verify badge rendering
- E2E: check API returns reminder-eligible todos
- Unit: reminder trigger time calculations
- Unit: duplicate prevention behavior

## Out of Scope
- Push notifications outside browser context
- Email or SMS reminder channels

## Success Metrics
- Reminder dispatch accuracy at configured threshold.
- Zero duplicate notifications in regression tests.
- Polling and notification checks complete under 300ms average.
