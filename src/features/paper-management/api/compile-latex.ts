import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';
import {
  buildLatexPackageImports,
  normalizeLatexPackages,
  extractPackageName,
} from '../lib/latex-packages';

// Extract the raw @entry{} lines from a bibContent that may be wrapped in
// \begin{filecontents}...\end{filecontents}
const extractBibEntries = (referenceContent?: string): string => {
  const raw = referenceContent?.trim() ?? '';
  const m = raw.match(
    /\\begin\{filecontents[*]?\}\{[^}]+\}([\s\S]*?)\\end\{filecontents[*]?\}/,
  );
  return m ? m[1].trim() : raw;
};

// Normalize unicode typographic characters to safe LaTeX equivalents so that
// pdflatex with T1/OT1 fonts (ec-*) does not emit "Missing character" warnings.
const sanitizeBibValue = (value: string): string =>
  value
    .replace(/\u2013/g, '--') // en-dash
    .replace(/\u2014/g, '---') // em-dash
    .replace(/\u2018|\u2019/g, "'") // curly single quotes
    .replace(/\u201C|\u201D/g, '"'); // curly double quotes

// Read a top-level braced field value from a BibTeX entry body, handling nested braces.
const readBibField = (body: string, name: string): string => {
  const re = new RegExp(`\\b${name}\\s*=\\s*\\{`, 'i');
  const idx = body.search(re);
  if (idx === -1) return '';
  const braceStart = body.indexOf('{', idx);
  if (braceStart === -1) return '';
  let depth = 1;
  let i = braceStart + 1;
  while (i < body.length && depth > 0) {
    if (body[i] === '{') depth++;
    else if (body[i] === '}') depth--;
    i++;
  }
  return body.slice(braceStart + 1, i - 1).trim();
};

// Convert raw BibTeX entries to a \begin{thebibliography} block that renders
// correctly in a single pdflatex pass (no bibtex/biber run needed).
const bibToThebibliography = (bibEntries: string): string => {
  if (!bibEntries.trim()) return '';

  const items: string[] = [];
  // Match each @TYPE{key, ...body...} block (body ends at the matching closing brace)
  const typeKeyRe = /@\w+\{([^,\s]+)\s*,/g;
  let km: RegExpExecArray | null;
  while ((km = typeKeyRe.exec(bibEntries)) !== null) {
    const key = km[1].trim();
    // Find the body between the opening brace after the key and is matching close
    const bodyStart = bibEntries.indexOf(',', km.index) + 1;
    // Walk to find the matching closing brace for this entry
    let depth = 1;
    let i = km.index + km[0].indexOf('{') + 1;
    while (i < bibEntries.length && depth > 0) {
      if (bibEntries[i] === '{') depth++;
      else if (bibEntries[i] === '}') depth--;
      i++;
    }
    const body = bibEntries.slice(bodyStart, i - 1);

    const author = sanitizeBibValue(readBibField(body, 'author'));
    const title = sanitizeBibValue(readBibField(body, 'title'));
    const journal = sanitizeBibValue(
      readBibField(body, 'journal') ||
        readBibField(body, 'booktitle') ||
        readBibField(body, 'publisher'),
    );
    const year = sanitizeBibValue(readBibField(body, 'year'));
    const volume = sanitizeBibValue(readBibField(body, 'volume'));
    const pages = sanitizeBibValue(readBibField(body, 'pages'));

    const parts: string[] = [];
    if (author) parts.push(author.replace(/ and /g, ', '));
    if (title) parts.push(`\\textit{${title}}`);
    if (journal) parts.push(journal);
    if (volume) parts.push(`vol.~${volume}`);
    if (pages) parts.push(`pp.~${pages}`);
    if (year) parts.push(`(${year})`);

    if (parts.length > 0) {
      items.push(`  \\bibitem{${key}} ${parts.join(', ')}.`);
    }
  }

  if (!items.length) return '';
  return `\n\n\\begin{thebibliography}{99}\n${items.join('\n\n')}\n\\end{thebibliography}`;
};

const LATEX_DOCUMENT_WRAPPER = (
  content: string,
  packages?: string[],
  referenceContent?: string,
) => {
  const normalizedPkgs = normalizeLatexPackages(packages);
  const hasBiblatex = normalizedPkgs.some(
    (pkg) => extractPackageName(pkg) === 'biblatex',
  );

  // biblatex requires a biber/bibtex binary run which is unavailable in the
  // compile service. Since we render via \begin{thebibliography} (single-pass),
  // loading biblatex is both unnecessary and incompatible — strip it.
  const compilePkgs = hasBiblatex
    ? packages?.filter((p) => extractPackageName(p) !== 'biblatex')
    : packages;

  const bibEntries = extractBibEntries(referenceContent);

  // biblatex is stripped from compilePkgs, so no filecontents/addbibresource needed.
  const bibliographyBlock = bibToThebibliography(bibEntries);

  return `\\documentclass{article}

${buildLatexPackageImports(compilePkgs)}

\\geometry{margin=1in}

\\begin{document}

${content}${bibliographyBlock}

\\end{document}`;
};

export const compileLatex = async ({
  content,
  packages,
  referenceContent,
}: {
  content: string;
  packages?: string[];
  referenceContent?: string;
}): Promise<Blob> => {
  // If content is a section fragment (no \documentclass), wrap it in a full document
  const latexContent = content.includes('\\documentclass')
    ? content
    : LATEX_DOCUMENT_WRAPPER(content, packages, referenceContent);

  const response = await api.post(
    PAPER_MANAGEMENT_API.COMPILE_LATEX,
    { content: latexContent },
    {
      responseType: 'arraybuffer',
      headers: { Accept: 'application/pdf' },
    },
  );

  const data = response as unknown as ArrayBuffer;
  return new Blob([data], { type: 'application/pdf' });
};

type UseCompileLatexOptions = {
  mutationConfig?: MutationConfig<typeof compileLatex>;
};

export const useCompileLatex = ({
  mutationConfig,
}: UseCompileLatexOptions = {}) => {
  return useMutation({
    mutationFn: compileLatex,
    ...mutationConfig,
  });
};
