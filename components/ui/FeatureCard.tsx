import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Shadcn UI Card
import Icon from '@/components/ui/Icon'; // Your Icon component
import { LucideProps } from 'lucide-react'; // For icon name type
import { icons } from 'lucide-react'; // For icon name type

export interface FeatureCardProps {
  iconName: keyof typeof icons;
  iconColor?: string;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  iconName, 
  iconColor = "#3B82F6", // Default to accent-blue
  title, 
  description, 
  className 
}) => {
  return (
    <Card className={`bg-card-bg border-neutral-700 shadow-lg h-full flex flex-col ${className || ''}`}>
      <CardHeader className="flex flex-row items-center space-x-4 pb-4">
        <Icon name={iconName} size={32} color={iconColor} className="text-accent-blue" />
        <CardTitle className="text-xl font-semibold text-neutral-text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-neutral-text-secondary text-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard; 