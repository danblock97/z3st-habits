export function getLocalDateForTZ(tz: string, at: Date = new Date(), graceHour = 3): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(at);
    const lookup = (type: 'year' | 'month' | 'day' | 'hour'): string => {
      const match = parts.find((part) => part.type === type)?.value;
      if (!match) {
        throw new Error(`Missing part: ${type}`);
      }
      return match;
    };

    const year = lookup('year');
    const month = lookup('month');
    const day = lookup('day');
    const hour = Number.parseInt(lookup('hour'), 10);

    if (Number.isNaN(hour)) {
      throw new Error('Invalid hour value.');
    }

    if (hour >= graceHour) {
      return `${year}-${month}-${day}`;
    }

    const midnightUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    midnightUtc.setUTCDate(midnightUtc.getUTCDate() - 1);
    return midnightUtc.toISOString().slice(0, 10);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}
