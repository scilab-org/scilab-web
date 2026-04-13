import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';

import { HERO } from '../constants';
import heroImage from '../assets/images/image.png';

export const HeroSection = () => {
  return (
    <section className="bg-background px-8 pt-20 pb-0 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        {/* Asymmetric editorial grid — 3:2 content:visual */}
        <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12">
          {/* Left — editorial content block */}
          <div className="lg:col-span-7">
            <p className="text-muted-foreground mb-6 text-[0.625rem] font-medium tracking-[0.3em] uppercase">
              {HERO.tag}
            </p>

            <h1 className="font-headline text-foreground mb-10 text-6xl leading-[0.95] font-light tracking-tight lg:text-8xl">
              {HERO.headline.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <div className="border-foreground/20 mb-12 max-w-lg border-l-2 pl-6">
              <p className="text-muted-foreground text-base leading-relaxed">
                {HERO.subline}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Button asChild className="hover:bg-cta-hover">
                <Link to={paths.app.root.getHref()}>{HERO.primaryCta}</Link>
              </Button>
              <Button asChild variant="link">
                <a href="#features">{HERO.secondaryCta}</a>
              </Button>
            </div>

            {/* Decorative rule */}
            <div className="bg-foreground/10 mt-20 h-px w-full" />
          </div>

          {/* Right — research draft visual */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="border-foreground/10 bg-primary relative overflow-hidden rounded-xl border">
              {/* System label bar */}
              <div className="border-primary-foreground/10 flex items-center justify-between border-b px-5 py-3">
                <span className="text-primary-foreground/40 font-mono text-[9px] tracking-[0.2em] uppercase">
                  {HERO.artifactRef}
                </span>
                <span className="text-primary-foreground/30 font-mono text-[9px] tracking-[0.15em] uppercase">
                  {HERO.artifactSub}
                </span>
              </div>

              {/* Image container */}
              <div className="relative aspect-4/3">
                <img
                  src={heroImage}
                  alt={HERO.artifactLabel}
                  className="size-full object-cover opacity-80"
                />
                {/* Subtle inner border */}
                <div className="border-primary-foreground/5 pointer-events-none absolute inset-0 border" />
              </div>

              {/* Caption bar */}
              <div className="border-primary-foreground/10 border-t px-5 py-4">
                <p className="font-headline text-primary-foreground/60 text-sm font-light italic">
                  {HERO.artifactLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
