type BibTeXEntry = {
  type: string;
  citationKey: string;
  fields: Record<string, string>;
  raw: string;
};

export type ParsedBibTeXMetadata = {
  title?: string;
  abstract?: string;
  authors?: string;
  publisher?: string;
  number?: string;
  pages?: string;
  volume?: string;
  ranking?: string;
  url?: string;
  doi?: string;
  journalName?: string;
  year?: string;
  month?: string;
  raw: string;
};

type JournalLike = {
  id: string;
  name: string;
};

export const normalizeVenueName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const findMatchingJournalId = <T extends JournalLike>(
  journals: T[],
  venueName?: string | null,
) => {
  if (!venueName?.trim()) return undefined;

  const normalizedVenueName = normalizeVenueName(venueName);
  if (!normalizedVenueName) return undefined;

  const exactMatch = journals.find(
    (journal) => normalizeVenueName(journal.name) === normalizedVenueName,
  );
  if (exactMatch) return exactMatch.id;

  const partialMatch = journals.find((journal) => {
    const normalizedJournalName = normalizeVenueName(journal.name);
    return (
      normalizedJournalName.includes(normalizedVenueName) ||
      normalizedVenueName.includes(normalizedJournalName)
    );
  });

  return partialMatch?.id;
};

const skipWhitespace = (input: string, index: number) => {
  let cursor = index;
  while (cursor < input.length && /\s/.test(input[cursor])) {
    cursor += 1;
  }
  return cursor;
};

const readBalancedValue = (
  input: string,
  startIndex: number,
  openChar: '{' | '"',
) => {
  const closeChar = openChar === '{' ? '}' : '"';
  let cursor = startIndex + 1;
  let depth = 1;
  let value = '';

  while (cursor < input.length) {
    const char = input[cursor];

    if (openChar === '"' && char === '\\' && cursor + 1 < input.length) {
      value += char + input[cursor + 1];
      cursor += 2;
      continue;
    }

    if (openChar === '{' && char === '{') {
      depth += 1;
      value += char;
      cursor += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        cursor += 1;
        break;
      }
      value += char;
      cursor += 1;
      continue;
    }

    value += char;
    cursor += 1;
  }

  return { value: value.trim(), nextIndex: cursor };
};

const cleanBibValue = (value: string) =>
  value.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();

const parseBibTeXEntry = (input: string): BibTeXEntry | null => {
  const trimmed = input.trim();
  const headerMatch = trimmed.match(/^@(\w+)\s*\{\s*([^,]+),/);
  if (!headerMatch) return null;

  const [, type, citationKey] = headerMatch;
  const bodyStart = headerMatch[0].length;
  const bodyEnd = trimmed.lastIndexOf('}');
  if (bodyEnd <= bodyStart) return null;

  const body = trimmed.slice(bodyStart, bodyEnd);
  const fields: Record<string, string> = {};
  let cursor = 0;

  while (cursor < body.length) {
    cursor = skipWhitespace(body, cursor);
    if (cursor >= body.length || body[cursor] === ',') {
      cursor += 1;
      continue;
    }

    const keyMatch = body.slice(cursor).match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=/);
    if (!keyMatch) {
      break;
    }

    const key = keyMatch[1].toLowerCase();
    cursor += keyMatch[0].length;
    cursor = skipWhitespace(body, cursor);
    if (cursor >= body.length) break;

    let parsedValue = '';

    if (body[cursor] === '{' || body[cursor] === '"') {
      const result = readBalancedValue(body, cursor, body[cursor] as '{' | '"');
      parsedValue = result.value;
      cursor = result.nextIndex;
    } else {
      let end = cursor;
      while (end < body.length && body[end] !== ',' && body[end] !== '\n') {
        end += 1;
      }
      parsedValue = body.slice(cursor, end).trim();
      cursor = end;
    }

    fields[key] = cleanBibValue(parsedValue);

    while (cursor < body.length && body[cursor] !== ',') {
      cursor += 1;
    }
    if (body[cursor] === ',') {
      cursor += 1;
    }
  }

  return {
    type,
    citationKey: citationKey.trim(),
    fields,
    raw: trimmed,
  };
};

export const parseBibTeXMetadata = (
  input: string,
): ParsedBibTeXMetadata | null => {
  const entry = parseBibTeXEntry(input);
  if (!entry) return null;

  return {
    title: entry.fields.title,
    abstract: entry.fields.abstract,
    authors: entry.fields.author,
    publisher: entry.fields.publisher,
    number: entry.fields.number,
    pages: entry.fields.pages,
    volume: entry.fields.volume,
    ranking: entry.fields.ranking,
    url: entry.fields.url,
    doi: entry.fields.doi,
    journalName: entry.fields.journal,
    year: entry.fields.year,
    month: entry.fields.month,
    raw: entry.raw,
  };
};
