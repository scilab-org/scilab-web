// Packages are stored and displayed as raw \usepackage{…} strings.

export const KNOWN_LATEX_PACKAGES: string[] = [
  // --- Encoding & Font ---
  '\\usepackage[utf8]{inputenc}',
  '\\usepackage[T1]{fontenc}',
  '\\usepackage{lmodern}',
  '\\usepackage{microtype}',
  '\\usepackage{fontawesome5}',
  '\\usepackage{mathptmx}',
  '\\usepackage{helvet}',
  '\\usepackage{courier}',

  // --- Math ---
  '\\usepackage{amsmath}',
  '\\usepackage{amssymb}',
  '\\usepackage{amsfonts}',
  '\\usepackage{amsthm}',
  '\\usepackage{mathtools}',
  '\\usepackage{bm}',
  '\\usepackage{siunitx}',
  '\\usepackage{physics}',
  '\\usepackage{nicefrac}',
  '\\usepackage{cancel}',

  // --- Graphics & Figures ---
  '\\usepackage{graphicx}',
  '\\usepackage{float}',
  '\\usepackage{caption}',
  '\\usepackage{subcaption}',
  '\\usepackage{wrapfig}',
  '\\usepackage{tikz}',
  '\\usepackage{pgfplots}',
  '\\usepackage{svg}',
  '\\usepackage{pdfpages}',
  '\\usepackage{rotating}',
  '\\usepackage{placeins}',

  // --- Tables ---
  '\\usepackage{booktabs}',
  '\\usepackage{array}',
  '\\usepackage{multirow}',
  '\\usepackage{longtable}',
  '\\usepackage{tabularx}',
  '\\usepackage{colortbl}',
  '\\usepackage{diagbox}',
  '\\usepackage{tabularray}',

  // --- Layout & Formatting ---
  '\\usepackage{geometry}',
  '\\usepackage{setspace}',
  '\\usepackage{parskip}',
  '\\usepackage{fancyhdr}',
  '\\usepackage{titlesec}',
  '\\usepackage{tocloft}',
  '\\usepackage{appendix}',
  '\\usepackage{pdflscape}',
  '\\usepackage{afterpage}',
  '\\usepackage{ragged2e}',

  // --- Colors & Boxes ---
  '\\usepackage{xcolor}',
  '\\usepackage{tcolorbox}',
  '\\usepackage{mdframed}',
  '\\usepackage{framed}',

  // --- Code & Algorithms ---
  '\\usepackage{listings}',
  '\\usepackage{minted}',
  '\\usepackage{algorithm}',
  '\\usepackage{algpseudocode}',
  '\\usepackage[ruled,vlined]{algorithm2e}',

  // --- References & Links ---
  '\\usepackage{hyperref}',
  '\\usepackage{url}',
  '\\usepackage{cite}',
  '\\usepackage{natbib}',
  '\\usepackage{cleveref}',
  '\\usepackage{varioref}',
  '\\usepackage{biblatex}',
  '\\usepackage[style=apa]{biblatex}',
  '\\usepackage[style=ieee]{biblatex}',

  // --- Language & Quotes ---
  '\\usepackage[english]{babel}',
  '\\usepackage{csquotes}',

  // --- Lists & Misc Text ---
  '\\usepackage{enumitem}',
  '\\usepackage{textcomp}',
  '\\usepackage{comment}',
  '\\usepackage{verbatim}',
  '\\usepackage{soul}',
  '\\usepackage{ulem}',
  '\\usepackage{lipsum}',

  // --- Abbreviations & Glossary ---
  '\\usepackage{acronym}',
  '\\usepackage[acronym]{glossaries}',
  '\\usepackage{nomencl}',

  // --- Utilities ---
  '\\usepackage{todonotes}',
  '\\usepackage{footmisc}',
  '\\usepackage{chngcntr}',
  '\\usepackage{etoolbox}',
  '\\usepackage{calc}',
  '\\usepackage{xparse}',
  '\\usepackage{xspace}',
  '\\usepackage{ifthen}',
];

const LATEX_BASE_PACKAGES: string[] = [
  '\\usepackage[utf8]{inputenc}',
  '\\usepackage[T1]{fontenc}',
  '\\usepackage{geometry}',
];

export const DEFAULT_LATEX_PACKAGES: string[] = [
  '\\usepackage[utf8]{inputenc}',
  '\\usepackage[T1]{fontenc}',
  '\\usepackage{amsmath}',
  '\\usepackage{amssymb}',
  '\\usepackage{amsfonts}',
  '\\usepackage{amsthm}',
  '\\usepackage{mathtools}',
  '\\usepackage{graphicx}',
  '\\usepackage{float}',
  '\\usepackage{caption}',
  '\\usepackage{subcaption}',
  '\\usepackage{wrapfig}',
  '\\usepackage{booktabs}',
  '\\usepackage{array}',
  '\\usepackage{multirow}',
  '\\usepackage{longtable}',
  '\\usepackage{tabularx}',
  '\\usepackage{colortbl}',
  '\\usepackage{algorithm}',
  '\\usepackage{algpseudocode}',
  '\\usepackage{geometry}',
  '\\usepackage{setspace}',
  '\\usepackage{hyperref}',
  '\\usepackage{url}',
  '\\usepackage{cite}',
  '\\usepackage{enumitem}',
  '\\usepackage{xcolor}',
  '\\usepackage{listings}',
  '\\usepackage{textcomp}',
  '\\usepackage{comment}',
  '\\usepackage{verbatim}',
];

/** Extract the package name from a raw \\usepackage string (or legacy short name). */
export const extractPackageName = (raw: string): string => {
  const m = raw.match(/\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/);
  return m ? m[1] : raw.replace(/\[.*\]$/, '').trim();
};

/** Legacy compat: old format "name" or "name[opts]" → raw \\usepackage string. */
const LEGACY_OPTION_MAP: Record<string, string> = {
  inputenc: '\\usepackage[utf8]{inputenc}',
  fontenc: '\\usepackage[T1]{fontenc}',
  biblatex: '\\usepackage{biblatex}',
};
const toLaTeX = (entry: string): string => {
  if (entry.startsWith('\\')) return entry;
  // Legacy short name, e.g. "amsmath" or "biblatex[style=ieee]"
  const optMatch = entry.match(/^([a-zA-Z0-9_-]+)\[(.+)\]$/);
  if (optMatch) {
    const [, name, opts] = optMatch;
    if (name === 'biblatex' && !opts.includes('backend=')) {
      return `\\usepackage[backend=bibtex,${opts}]{${name}}`;
    }
    return `\\usepackage[${opts}]{${name}}`;
  }
  return LEGACY_OPTION_MAP[entry] ?? `\\usepackage{${entry}}`;
};

export const normalizeLatexPackages = (packages?: string[]): string[] => {
  const source = packages?.length ? packages : DEFAULT_LATEX_PACKAGES;

  const seen = new Map<string, string>();
  for (const raw of [...LATEX_BASE_PACKAGES, ...source]) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const latex = toLaTeX(trimmed);
    const name = extractPackageName(latex);
    seen.set(name, latex);
  }

  return Array.from(seen.values());
};

// Biblatex styles that require the biber backend (do NOT work with bibtex).
const BIBER_ONLY_STYLES = new Set([
  'apa',
  'mla',
  'chem-acs',
  'phys',
  'science',
]);

export const buildLatexPackageImports = (packages?: string[]): string => {
  return normalizeLatexPackages(packages)
    .map((pkg) => {
      if (extractPackageName(pkg) !== 'biblatex') return pkg;
      // Detect style to choose the right backend.
      const styleMatch = pkg.match(/style=([a-z-]+)/i);
      const style = styleMatch ? styleMatch[1].toLowerCase() : '';
      const needsBiber = BIBER_ONLY_STYLES.has(style);
      // If backend is already correct, return as-is.
      if (!needsBiber && pkg.includes('backend=')) return pkg;
      if (needsBiber && pkg.includes('backend=biber')) return pkg;
      // Wrong or missing backend — fix it.
      const backend = needsBiber ? 'biber' : 'bibtex';
      // Replace existing backend= value if present.
      if (pkg.includes('backend=')) {
        return pkg.replace(/backend=[a-z]+/, `backend=${backend}`);
      }
      // Inject backend into existing options bracket.
      const optMatch = pkg.match(/\\usepackage\[([^\]]*)\]/);
      if (optMatch) {
        return pkg.replace(
          `[${optMatch[1]}]`,
          `[backend=${backend},${optMatch[1]}]`,
        );
      }
      return pkg.replace('\\usepackage{', `\\usepackage[backend=${backend}]{`);
    })
    .join('\n');
};
