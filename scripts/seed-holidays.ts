import { holidayDB } from '@/lib/db';

const HOLIDAYS = [
  { date: '2026-01-01', name: 'New Year\'s Day' },
  { date: '2026-02-17', name: 'Chinese New Year' },
  { date: '2026-02-18', name: 'Chinese New Year Holiday' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-01', name: 'Labour Day' },
  { date: '2026-08-09', name: 'National Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

for (const holiday of HOLIDAYS) {
  holidayDB.upsert(holiday.date, holiday.name);
}

console.log(`Seeded ${HOLIDAYS.length} holidays`);
