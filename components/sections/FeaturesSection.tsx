import React from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import FeatureCard, { FeatureCardProps } from '@/components/ui/FeatureCard';
// import { motion } from 'framer-motion'; // For animations later

const featuresData: FeatureCardProps[] = [
  {
    iconName: 'Zap', // Example icon from lucide-react
    title: 'Blazing Fast Automation',
    description: 'Execute complex workflows in seconds, not hours. Our optimized engine ensures peak performance.',
  },
  {
    iconName: 'Puzzle',
    title: 'Intuitive Visual Builder',
    description: 'No-code, drag-and-drop interface makes it easy for anyone to build powerful automations.',
  },
  {
    iconName: 'FileCode2',
    title: 'Developer Friendly',
    description: 'Extend and customize with webhooks, APIs, and custom scripts. Perfect for technical teams.',
  },
  {
    iconName: 'ShieldCheck',
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security and robust infrastructure ensure your data and workflows are safe.',
  },
  {
    iconName: 'Settings', // Changed to a known valid icon: Settings
    title: 'Insightful Analytics',
    description: 'Track your automation performance and identify areas for improvement with built-in analytics.',
  },
  {
    iconName: 'Users',
    title: 'Collaborative Workspace',
    description: 'Work together with your team to build, manage, and share automations seamlessly.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-primary-dark text-neutral-text-primary">
      <div className="container mx-auto px-6">
        <SectionTitle 
          title="Unlock Powerful Features"
          subtitle="Everything you need to connect your apps, automate tasks, and achieve more with less effort."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            // Potential animation wrapper: <motion.div key={index} ... >
            <FeatureCard 
              key={index}
              iconName={feature.iconName}
              title={feature.title}
              description={feature.description}
              iconColor={feature.iconColor} // if you want to vary colors
            />
            // </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 