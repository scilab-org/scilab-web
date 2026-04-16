/**
 * Format a UTC date string as a short date using the browser's locale and
 * local timezone (e.g. "Apr 17, 2026").
 */
export const formatLocalDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a UTC date string as a full date + time string using the browser's
 * locale and local timezone (e.g. "Apr 17, 2026 • 14:35 GMT+7").
 */
export const formatLocalDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  });
  return `${date} • ${time}`;
};
