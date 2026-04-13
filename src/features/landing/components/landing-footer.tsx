import { Link } from 'react-router';

import { paths } from '@/config/paths';

import { BRAND, FOOTER_LINKS } from '../constants';

export const LandingFooter = () => {
  return (
    <footer className="border-foreground/10 bg-background border-t px-8 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              to={paths.home.getHref()}
              className="font-headline text-foreground hover:text-foreground/70 text-base font-medium tracking-tight transition-colors duration-150"
            >
              {BRAND.name}
            </Link>
            <p className="text-muted-foreground mt-3 max-w-xs text-xs leading-relaxed">
              Write research papers with structure. From literature review to
              final submission — all in one place.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.group}>
              <h4 className="text-foreground mb-4 text-[0.625rem] font-medium tracking-[0.25em] uppercase">
                {group.group}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-xs transition-colors duration-150"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-foreground/10 flex flex-col items-start justify-between gap-3 border-t pt-8 md:flex-row md:items-center">
          <p className="text-muted-foreground font-mono text-[0.625rem] tracking-[0.15em] uppercase">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-muted-foreground/60 font-mono text-[0.625rem] tracking-widest uppercase">
            HyperDataLab v1.0
          </p>
        </div>
      </div>
    </footer>
  );
};
