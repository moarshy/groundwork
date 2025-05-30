import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/sections/HeroSection';
import IntegrationsShowcase from '@/components/sections/IntegrationsShowcase'; // Import IntegrationsShowcase
import FeaturesSection from '@/components/sections/FeaturesSection'; // Import FeaturesSection
import HowItWorksSection from '@/components/sections/HowItWorksSection'; // Import HowItWorksSection
import ValuePropositionSection from '@/components/sections/ValuePropositionSection'; // Import ValuePropositionSection
import TestimonialsSection from '@/components/sections/TestimonialsSection'; // Import TestimonialsSection
import FinalCTASection from '@/components/sections/FinalCTASection'; // Import FinalCTASection

export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <IntegrationsShowcase />
      <FeaturesSection /> 
      <HowItWorksSection /> 
      <ValuePropositionSection />
      <TestimonialsSection />
      <FinalCTASection />
    </Layout>
  );
}
