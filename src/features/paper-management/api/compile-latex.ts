import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';

const LATEX_DOCUMENT_WRAPPER = (content: string) =>
  `\\documentclass{article}
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
