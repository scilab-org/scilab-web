import { PROGRESSION } from '../constants';

type StepColumnProps = {
  number: string;
  title: string;
  description: string;
};

const StepColumn = ({ number, title, description }: StepColumnProps) => (
  <div className="border-foreground flex flex-col border-t-2 pt-6">
    <span className="text-muted-foreground mb-4 font-mono text-[0.625rem] font-medium tracking-[0.2em]">
      {number}
    </span>
    <h3 className="text-foreground mb-3 text-sm font-medium tracking-widest uppercase">
      {title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed">
      {description}
    </p>
  </div>
);

export const ProgressionSection = () => {
  return (
    <section id="workflow" className="bg-surface-container-low px-8 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16">
          <p className="text-muted-foreground mb-3 text-[0.625rem] font-medium tracking-[0.3em] uppercase">
            {PROGRESSION.ref}
          </p>
          <h2 className="font-headline text-foreground text-4xl font-light tracking-tight lg:text-6xl">
            {PROGRESSION.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {PROGRESSION.steps.map((step) => (
            <StepColumn
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
