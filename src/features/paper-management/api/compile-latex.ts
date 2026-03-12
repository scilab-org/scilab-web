import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { PAPER_MANAGEMENT_API } from '../constants';

const LATEX_DOCUMENT_WRAPPER = (content: string) =>
  `\\documentclass{article}

% Encoding
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}

% Math
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
\\usepackage{amsthm}
\\usepackage{mathtools}

% Figures
\\usepackage{graphicx}
\\usepackage{float}
\\usepackage{caption}
\\usepackage{subcaption}
\\usepackage{wrapfig}

% Tables
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{multirow}
\\usepackage{longtable}
\\usepackage{tabularx}
\\usepackage{colortbl}

% Algorithms
\\usepackage{algorithm}
\\usepackage{algpseudocode}

% Layout
\\usepackage{geometry}
\\usepackage{setspace}

% References
\\usepackage{hyperref}
\\usepackage{url}
\\usepackage{cite}

% Lists
\\usepackage{enumitem}

% Colors
\\usepackage{xcolor}

% Code
\\usepackage{listings}

% Symbols
\\usepackage{textcomp}

% Utilities
\\usepackage{comment}
\\usepackage{verbatim}

\\geometry{margin=1in}

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
