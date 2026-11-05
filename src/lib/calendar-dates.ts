/** Calendar-only arithmetic: no conversion of a local midnight to UTC. */
export function calendarDates(today: string, count: number): string[] {
 const anchor = new Date(`${today}T12:00:00Z`);
 return Array.from({ length: count }, (_, i) => {
  const date = new Date(anchor); date.setUTCDate(date.getUTCDate() - count + 1 + i);
  return date.toISOString().slice(0, 10);
 });
}
export function localCalendarToday(now = new Date()): string {
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
