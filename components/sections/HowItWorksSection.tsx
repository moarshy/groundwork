import React from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import Icon from '@/components/ui/Icon'; // Your Icon component
import { icons } from 'lucide-react'; // For icon name type

interface StepData {
  id: number;
  iconName: keyof typeof icons;
  title: string;
  description: string;
}

const stepsData: StepData[] = [
  {
    id: 1,
    iconName: 'MousePointerClick',
    title: 'Connect Your Apps',
    description: 'Link your favorite tools and services to Groundwork in just a few clicks. No coding required.',
  },
  {
    id: 2,
    iconName: 'Workflow',
    title: 'Build Your Workflow',
    description: 'Use our intuitive visual builder to design custom automations. Set triggers, actions, and conditions.',
  },
  {
    id: 3,
    iconName: 'Play',
    title: 'Run & Monitor',
    description: 'Activate your workflows and watch them run. Get real-time insights and notifications.',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-card-bg text-neutral-text-primary">
      <div className="container mx-auto px-6">
        <SectionTitle 
          title="Get Started in Minutes"
          subtitle="Automating your work with Groundwork is simple and straightforward."
        />
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {stepsData.map((step) => (
            <div key={step.id} className="flex flex-col items-center text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-accent-blue rounded-full text-primary-dark">
                <Icon name={step.iconName} size={32} />
              </div>
              <h3 className="text-xl font-semibold text-neutral-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-neutral-text-secondary text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 