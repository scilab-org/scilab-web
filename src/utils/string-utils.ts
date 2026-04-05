export function capitalize(word: string | null | undefined): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Formats a publication date string smartly:
 * - day=1, month=January -> show year only (e.g. "2010")
 * - day=1, month!=January -> show month + year (e.g. "Aug 2010")
 * - otherwise -> show full date (e.g. "8/15/2010")
 */
export function formatPublicationDate(
  dateStr: string | null | undefined,
): string {
  if (!dateStr) return 'N/A';
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  if (!year) return 'N/A';
  if (day === 1 && month === 1) return String(year);
  if (day === 1) {
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
  return new Date(year, month - 1, day).toLocaleDateString();
}
