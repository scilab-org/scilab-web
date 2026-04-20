import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';
import { extractPackageName } from '../lib/latex-packages';

const buildLatexPackageImportsRaw = (packages?: string[]): string => {
  return (packages ?? [])
    .map((pkg) => {
      const trimmed = pkg.trim();
      if (!trimmed) return '';
      // Preserve the user's exact \usepackage line (including options).
      if (trimmed.startsWith('\\usepackage')) return trimmed;
      // Preserve any other LaTeX preamble command lines as-is.
      if (trimmed.startsWith('\\')) return trimmed;
      // Backward compat: legacy stored package name → wrap.
      return `\\usepackage{${trimmed}}`;
    })
    .filter(Boolean)
    .join('\n');
};

const dedupePackages = (packages?: string[]): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of packages ?? []) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const name = extractPackageName(trimmed);
    if (seen.has(name)) continue;
    seen.add(name);
    result.push(trimmed);
  }
  return result;
};

const buildReferenceBlock = (referenceContent?: string): string => {
  return referenceContent?.trim() ?? '';
};

const LATEX_DOCUMENT_WRAPPER = (
  content: string,
  sectionPackages?: string[],
  referenceContent?: string,
) => {
  // Only use packages from the main section (reference packages are excluded).
  const pkgs = dedupePackages(sectionPackages);

  // Extract \documentclass line from packages (first match wins); keep order for the rest.
  const docClassPkg = pkgs.find((p) => p.trim().startsWith('\\documentclass'));
  const remainingPackages = pkgs.filter(
    (p) => !p.trim().startsWith('\\documentclass'),
  );

  const referenceBlock = buildReferenceBlock(referenceContent);
  const finalBody = (content?.trim() ?? '').trim();
  const preambleReference = referenceBlock ? `\n\n${referenceBlock}` : '';
  const docClassLine = docClassPkg?.trim() ?? '\\documentclass{article}';

  return `${docClassLine}

${buildLatexPackageImportsRaw(remainingPackages)}

${preambleReference}

\\begin{document}

${finalBody}

\\printbibliography
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
