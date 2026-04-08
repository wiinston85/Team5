# PRP 09 - Export and Import

## Feature Overview
Support data portability by exporting todos (JSON and CSV) and importing valid JSON backups with relationship preservation.

## User Stories
- As a user, I can export JSON for backup and restore.
- As a user, I can export CSV for spreadsheet analysis.
- As a user, I can import JSON and recreate my todo data.

## User Flow
1. User clicks Export JSON or Export CSV.
2. File is downloaded with date-based filename.
3. User selects Import and chooses JSON file.
4. System validates payload and creates new records.

## Technical Requirements
- API routes:
  - GET /api/todos/export
  - POST /api/todos/import
- Export JSON should include todo relationships (subtasks, tags, links).
- Import must validate structure and required fields.
- Import process remaps IDs and resolves tag conflicts deterministically.
- Return success counts and clear error messages.

## UI Components
- Export JSON button
- Export CSV button
- Import button with file picker
- Success and error status messaging

## Edge Cases
- Invalid JSON must fail safely with user-facing error.
- Partial payload corruption should not create inconsistent state.
- Importing duplicate semantic data may create duplicates by design and should be documented.
- Large files should surface timeout or size handling clearly.

## Acceptance Criteria
- JSON export is valid and restorable.
- CSV export is readable in common spreadsheet tools.
- Import restores relationships correctly.
- Error messages are explicit for invalid imports.

## Testing Requirements
- E2E: export JSON and CSV
- E2E: import valid JSON backup
- E2E: import invalid JSON and verify error path
- Unit: ID remapping and tag conflict resolution
- E2E: imported data appears without manual refresh

## Out of Scope
- CSV import support
- Encrypted backup package management

## Success Metrics
- 100 percent successful roundtrip for valid sample exports.
- Zero orphan relations after import.
- Import and export operations complete within acceptable time for typical dataset sizes.
