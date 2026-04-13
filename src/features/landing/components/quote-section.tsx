import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';

import { STATEMENT } from '../constants';

export const QuoteSection = () => {
  return (
    <section id="about" className="bg-background px-8 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">
          {/* Left — large editorial statement */}
          <div className="lg:col-span-8">
            <p className="text-muted-foreground mb-4 text-[0.625rem] font-medium tracking-[0.3em] uppercase">
              {STATEMENT.ref}
            </p>

            <p className="font-headline text-foreground mb-8 text-3xl leading-snug font-light tracking-tight lg:text-5xl">
              {STATEMENT.text.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>

            <div className="bg-foreground/20 h-px w-24" />
          </div>

          {/* Right — supporting context + CTAs */}
          <div className="flex flex-col justify-end lg:col-span-4">
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              {STATEMENT.sub}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="hover:bg-cta-hover">
                <Link to={paths.app.root.getHref()}>
                  {STATEMENT.primaryCta}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={paths.app.root.getHref()}>
                  {STATEMENT.secondaryCta}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
