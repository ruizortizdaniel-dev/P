export interface DayInfo {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  dayOfWeekShort: string; // L, M, X, J, V, S, D
  dayOfWeekIndex: number; // 0=Sunday, 1=Monday...
  isWeekend: boolean;
  isToday: boolean;
}

const SPANISH_DAY_ABBR = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getMonthDays(year: number, month: number): DayInfo[] {
  // month is 1-indexed (1=January, 10=October)
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days: DayInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    days.push({
      dayNumber: d,
      dateStr,
      dayOfWeekShort: SPANISH_DAY_ABBR[dayOfWeek],
      dayOfWeekIndex: dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: dateStr === todayStr
    });
  }

  return days;
}

export function formatMonthName(year: number, month: number): string {
  return `${MONTH_NAMES_ES[month - 1]} ${year}`;
}
