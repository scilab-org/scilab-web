export const BRAND = {
  name: 'HYPERDATALAB',
  tagline: 'A friendly space for student research',
} as const;

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#workflow' },
  { label: 'About', href: '#about' },
] as const;

export const HERO = {
  tag: 'STUDENT RESEARCH PLATFORM',
  headline: 'Grow Your Ideas\nWrite With\nConfidence.',
  subline:
    'Keep your ideas in one place, work with friends, and turn your thoughts into a complete paper step by step.',
  primaryCta: 'Get Started',
  secondaryCta: 'Explore Features',
  artifactRef: 'DOC: 001–A',
  artifactLabel: 'Your First Paper',
  artifactSub: 'Simple Template · v1',
} as const;

export const FEATURES = {
  label: 'What You Can Do',
  ref: 'FEATURES',
  items: [
    {
      ref: 'I',
      title: 'Collect Your Ideas',
      description:
        'Save links, notes, and references in one place. Keep everything organized before you start writing.',
    },
    {
      ref: 'II',
      title: 'Write Step by Step',
      description:
        'Follow simple sections to build your paper. No need to worry about structure — we guide you.',
    },
    {
      ref: 'III',
      title: 'Add Citations Easily',
      description:
        'Insert citations and build your reference list without stress. We help format everything for you.',
    },
  ],
} as const;

export const PROGRESSION = {
  ref: 'HOW IT WORKS',
  title: 'Your Writing Journey',
  steps: [
    {
      number: '01',
      title: 'Start with Ideas',
      description:
        'Collect notes, links, and papers. Organize what you want to write about.',
    },
    {
      number: '02',
      title: 'Write Together',
      description:
        'Work on your paper step by step. Share and collaborate with your friends or teammates.',
    },
    {
      number: '03',
      title: 'Finish Your Paper',
      description:
        'Add citations, review your work, and export your final version with ease.',
    },
  ],
} as const;

export const STATEMENT = {
  ref: 'ABOUT',
  text: 'From first idea\nto finished paper.',
  sub: 'Everything you need to write and learn in one simple place.',
  primaryCta: 'Get Started',
  secondaryCta: 'Learn More',
} as const;

export const FOOTER_LINKS = [
  {
    group: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#workflow' },
      { label: 'Guide', href: '#docs' },
    ],
  },
  {
    group: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Privacy', href: '#privacy' },
    ],
  },
] as const;