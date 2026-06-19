export function formatWatermarkDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatEntryTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatPastEchoLabel(dateStr?: string): string {
  if (!dateStr) return 'You wrote something like this before';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'You wrote something like this yesterday';
  if (diffDays < 7) return 'You wrote something like this a few days ago';
  if (diffDays < 30) return 'You wrote something like this a few weeks ago';
  if (diffDays < 60) return 'You wrote something like this about a month ago';
  if (diffDays < 120) return 'You wrote something like this a couple of months ago';
  if (diffDays < 365) return 'You wrote something like this several months ago';
  return 'You wrote something like this a while ago';
}

export function groupEntriesByPeriod<T extends { created_at: string }>(
  entries: T[]
): { label: string; entries: T[] }[] {
  const now = new Date();
  const groups = new Map<string, T[]>();

  for (const entry of entries) {
    const date = new Date(entry.created_at);
    const label = getPeriodLabel(date, now);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }

  return Array.from(groups.entries()).map(([label, groupEntries]) => ({
    label,
    entries: groupEntries,
  }));
}

function getPeriodLabel(date: Date, now: Date): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return 'Earlier this month';
  }

  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function buildObserverNote(insight: {
  takeaway?: string;
  emotional_tone?: string;
  pattern_name?: string;
}): string | null {
  if (insight.takeaway && insight.takeaway !== 'Insights will appear once processing completes.') {
    return insight.takeaway;
  }
  return null;
}

export function describePatternOccurrence(name: string, count: number): string {
  if (count === 1) return `${name} showed up once`;
  if (count === 2) return `${name} has appeared a couple of times`;
  if (count <= 4) return `${name} keeps coming back`;
  return `${name} has been a recurring thread`;
}

export function describeTonePresence(tone: string, count: number): string {
  const label = tone.toLowerCase();
  if (count === 1) return `A ${label} note, once`;
  if (count <= 3) return `${tone} has been showing up lately`;
  return `${tone} has been a familiar feeling in recent entries`;
}

export function describePersonPresence(
  name: string,
  stats: { positive: number; negative: number; neutral: number }
): string {
  const total = stats.positive + stats.negative + stats.neutral;
  if (total === 1) return `${name} appeared in an entry`;
  if (stats.positive > stats.negative) {
    return `${name} tends to come up in lighter moments`;
  }
  if (stats.negative > stats.positive) {
    return `${name} often appears when things feel heavier`;
  }
  return `${name} keeps appearing in your writing`;
}
