export const BRAND = {
  name: 'HYPERDATALAB',
  tagline: 'Academic Writing Platform',
} as const;

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#workflow' },
  { label: 'About', href: '#about' },
] as const;

export const HERO = {
  tag: 'ACADEMIC WRITING PLATFORM',
  headline: 'Write Research\nPapers With\nStructure.',
  subline:
    'Organize your literature review, draft each section of your paper, and manage citations — all in one place.',
  primaryCta: 'Get Started',
  secondaryCta: 'View Features',
  artifactRef: 'DOC: 001–A',
  artifactLabel: 'Research Paper Draft',
  artifactSub: 'IMRaD Template · v1',
} as const;

export const FEATURES = {
  label: 'What You Can Do',
  ref: 'FEATURES',
  items: [
    {
      ref: 'I',
      title: 'Literature Review',
      description:
        'Collect, organize, and annotate your sources. Keep track of every paper before you start writing.',
    },
    {
      ref: 'II',
      title: 'Paper Structure',
      description:
        'Write with IMRaD templates. Introduction, Methods, Results, and Discussion — guided section by section.',
    },
    {
      ref: 'III',
      title: 'Citation Management',
      description:
        'Add citations and build your reference list automatically. Supports APA, MLA, Chicago, and IEEE.',
    },
  ],
} as const;

export const PROGRESSION = {
  ref: 'HOW IT WORKS',
  title: 'Your Writing Process',
  steps: [
    {
      number: '01',
      title: 'Gather Sources',
      description:
        'Search and save papers from your field. Annotate them and build your reference list.',
    },
    {
      number: '02',
      title: 'Write Your Paper',
      description:
        'Use structured templates to draft each section. Collaborate with your team in real time.',
    },
    {
      number: '03',
      title: 'Cite & Submit',
      description:
        'Format references automatically for any journal style. Review with your team and export.',
    },
  ],
} as const;

export const STATEMENT = {
  ref: 'ABOUT',
  text: 'From first draft\nto final submission.',
  sub: 'One place for your entire academic writing process.',
  primaryCta: 'Get Started',
  secondaryCta: 'Learn More',
} as const;

export const FOOTER_LINKS = [
  {
    group: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#workflow' },
      { label: 'Documentation', href: '#docs' },
    ],
  },
  {
    group: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Privacy Policy', href: '#privacy' },
    ],
  },
] as const;
