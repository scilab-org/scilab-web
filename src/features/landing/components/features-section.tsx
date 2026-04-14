import { FEATURES } from '../constants';

type ModuleRowProps = {
  ref_: string;
  title: string;
  description: string;
};

const ModuleRow = ({ ref_, title, description }: ModuleRowProps) => (
  <article className="border-foreground/10 grid grid-cols-1 gap-4 border-t py-8 md:grid-cols-12 md:gap-8">
    <span className="text-muted-foreground font-sans text-[0.625rem] tracking-[0.2em] uppercase md:col-span-2">
      {ref_}
    </span>
    <h3 className="text-foreground text-lg font-medium tracking-tight md:col-span-3">
      {title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed md:col-span-7">
      {description}
    </p>
  </article>
);

export const FeaturesSection = () => {
  return (
    <section id="features" className="bg-background px-8 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <p className="text-muted-foreground mb-3 text-[0.625rem] font-medium tracking-[0.3em] uppercase">
            {FEATURES.ref}
          </p>
          <h2 className="font-headline text-foreground text-4xl font-light tracking-tight lg:text-5xl">
            {FEATURES.label}
          </h2>
        </div>

        <div>
          {FEATURES.items.map((item) => (
            <ModuleRow
              key={item.ref}
              ref_={item.ref}
              title={item.title}
              description={item.description}
            />
          ))}
          <div className="border-foreground/10 border-t" />
        </div>
      </div>
    </section>
  );
};
