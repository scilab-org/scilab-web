import { useMutation } from '@tanstack/react-query';

import { MutationConfig } from '@/lib/react-query';

const LATEX_COMPILE_URL = 'https://api.hyperdatalab.site/latex-service/compile';

const LATEX_DOCUMENT_WRAPPER = (content: string) =>
  `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{float}
\\usepackage{capt-of}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{longtable}
\\usepackage{geometry}
\\begin{document}
${content}
\\end{document}`;

export const compileLatex = async ({
  content,
}: {
  content: string;
}): Promise<Blob> => {
  // If content is a section fragment (no \documentclass), wrap it in a full document
  const latexContent = content.includes('\\documentclass')
    ? content
    : LATEX_DOCUMENT_WRAPPER(content);

  const response = await fetch(LATEX_COMPILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: latexContent }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Compilation failed (${response.status})`);
  }

  const blob = await response.blob();
  // Ensure the blob has the correct PDF MIME type
  if (blob.type && blob.type === 'application/pdf') {
    return blob;
  }
  return new Blob([blob], { type: 'application/pdf' });
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
