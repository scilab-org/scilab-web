const LATEX_PACKAGE_IMPORTS: Record<string, string> = {
  inputenc: '\\usepackage[utf8]{inputenc}',
  fontenc: '\\usepackage[T1]{fontenc}',
  amsmath: '\\usepackage{amsmath}',
  amssymb: '\\usepackage{amssymb}',
  amsfonts: '\\usepackage{amsfonts}',
  amsthm: '\\usepackage{amsthm}',
  mathtools: '\\usepackage{mathtools}',
  graphicx: '\\usepackage{graphicx}',
  float: '\\usepackage{float}',
  caption: '\\usepackage{caption}',
  subcaption: '\\usepackage{subcaption}',
  wrapfig: '\\usepackage{wrapfig}',
  booktabs: '\\usepackage{booktabs}',
  array: '\\usepackage{array}',
  multirow: '\\usepackage{multirow}',
  longtable: '\\usepackage{longtable}',
  tabularx: '\\usepackage{tabularx}',
  colortbl: '\\usepackage{colortbl}',
  algorithm: '\\usepackage{algorithm}',
  algpseudocode: '\\usepackage{algpseudocode}',
  geometry: '\\usepackage{geometry}',
  setspace: '\\usepackage{setspace}',
  hyperref: '\\usepackage{hyperref}',
  url: '\\usepackage{url}',
  cite: '\\usepackage{cite}',
  enumitem: '\\usepackage{enumitem}',
  xcolor: '\\usepackage{xcolor}',
  listings: '\\usepackage{listings}',
  textcomp: '\\usepackage{textcomp}',
  comment: '\\usepackage{comment}',
  verbatim: '\\usepackage{verbatim}',
  biblatex: '\\usepackage{biblatex}',
};

const LATEX_BASE_PACKAGES = ['inputenc', 'fontenc', 'geometry'];

export const DEFAULT_LATEX_PACKAGES = [
  'inputenc',
  'fontenc',
  'amsmath',
  'amssymb',
  'amsfonts',
  'amsthm',
  'mathtools',
  'graphicx',
  'float',
  'caption',
  'subcaption',
  'wrapfig',
  'booktabs',
  'array',
  'multirow',
  'longtable',
  'tabularx',
  'colortbl',
  'algorithm',
  'algpseudocode',
  'geometry',
  'setspace',
  'hyperref',
  'url',
  'cite',
  'enumitem',
  'xcolor',
  'listings',
  'textcomp',
  'comment',
  'verbatim',
] as const;

export const normalizeLatexPackages = (packages?: string[]): string[] => {
  const source = packages?.length ? packages : DEFAULT_LATEX_PACKAGES;

  return Array.from(
    new Set(
      [...LATEX_BASE_PACKAGES, ...source]
        .map((pkg) => pkg.trim())
        .filter(Boolean),
    ),
  );
};

export const buildLatexPackageImports = (packages?: string[]): string => {
  return normalizeLatexPackages(packages)
    .map((pkg) => LATEX_PACKAGE_IMPORTS[pkg] ?? `\\usepackage{${pkg}}`)
    .join('\n');
};
