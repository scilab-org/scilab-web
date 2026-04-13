import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { login, useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

import { BRAND, NAV_LINKS } from '../constants';

type LandingNavProps = {
  className?: string;
};

export const LandingNav = ({ className }: LandingNavProps) => {
  const { data: user } = useUser();

  return (
    <header
      className={cn(
        'border-foreground/10 bg-background sticky top-0 z-50 border-b',
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <Link
          to={paths.home.getHref()}
          className="font-headline text-foreground hover:text-foreground/70 text-base font-medium tracking-tight transition-colors duration-150"
        >
          {BRAND.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-xs tracking-[0.15em] uppercase transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {user ? (
          <Button asChild size="sm" className="hover:bg-cta-hover">
            <Link to={paths.app.root.getHref()}>Go to Portal</Link>
          </Button>
        ) : (
          <Button size="sm" className="hover:bg-cta-hover" onClick={login}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};
