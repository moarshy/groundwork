import React from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import FeatureCard, { FeatureCardProps } from '@/components/ui/FeatureCard';

const valuePropsData: FeatureCardProps[] = [
  {
    iconName: 'TrendingUp',
    title: 'Boost Productivity',
    description: 'Automate repetitive tasks and free up your team to focus on high-value work that drives growth.',
  },
  {
    iconName: 'DollarSign',
    title: 'Reduce Operational Costs',
    description: 'Minimize manual effort, reduce errors, and optimize resource allocation to save money.',
  },
  {
    iconName: 'Users',
    title: 'Enhance Collaboration',
    description: 'Streamline communication and data flow between teams and applications for better teamwork.',
  },
  {
    iconName: 'Scaling',
    title: 'Scale With Confidence',
    description: 'Our robust platform handles growing workloads, ensuring reliability as your business expands.',
  },
  {
    iconName: 'Lightbulb',
    title: 'Drive Innovation',
    description: 'Quickly adapt to market changes and implement new ideas by easily modifying and deploying workflows.',
  },
  {
    iconName: 'Smile',
    title: 'Improve Employee Satisfaction',
    description: 'Eliminate tedious manual processes, allowing your team to engage in more meaningful and fulfilling tasks.',
  },
];

const ValuePropositionSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-primary-dark text-neutral-text-primary">
      <div className="container mx-auto px-6">
        <SectionTitle 
          title="The Groundwork Advantage"
          subtitle="Discover how our AI-powered automation platform can transform your business."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {valuePropsData.map((prop, index) => (
            <FeatureCard 
              key={index}
              iconName={prop.iconName}
              title={prop.title}
              description={prop.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection; 