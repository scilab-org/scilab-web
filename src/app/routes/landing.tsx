import { Head } from '@/components/seo';
import { FeaturesSection } from '@/features/landing/components/features-section';
import { HeroSection } from '@/features/landing/components/hero-section';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { LandingNav } from '@/features/landing/components/landing-nav';
import { ProgressionSection } from '@/features/landing/components/progression-section';
import { QuoteSection } from '@/features/landing/components/quote-section';

const LandingRoute = () => {
  return (
    <>
      <Head description="HyperDataLab — scientific research collaboration platform" />
      <div className="bg-background text-foreground min-h-screen">
        <LandingNav />
        <main>
          <HeroSection />
          <FeaturesSection />
          <ProgressionSection />
          <QuoteSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
};

export default LandingRoute;
