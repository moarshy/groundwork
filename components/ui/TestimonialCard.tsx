import React from 'react';
import {
  Card,
  CardContent,
  // CardFooter, // If adding footer elements later
  // CardHeader, // If adding header elements later
} from "@/components/ui/card"; // Shadcn UI Card
import Image from 'next/image'; // Import Next Image

export interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
  avatarUrl?: string; // Optional: URL to an avatar image
  className?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  quote, 
  name, 
  title, 
  avatarUrl,
  className 
}) => {
  return (
    <Card className={`bg-card-bg border-neutral-700 shadow-lg p-6 h-full flex flex-col ${className || ''}`}>
      <CardContent className="flex-grow mb-4">
        <p className="text-neutral-text-primary italic text-lg leading-relaxed before:content-['\201C'] before:mr-1 before:text-3xl before:text-accent-blue after:content-['\201D'] after:ml-1 after:text-3xl after:text-accent-blue">
          {quote}
        </p>
      </CardContent>
      <div className="flex items-center mt-auto">
        {avatarUrl ? (
          <Image 
            src={avatarUrl} 
            alt={name} 
            width={48} // Required for Next Image
            height={48} // Required for Next Image
            className="rounded-full mr-4 object-cover" 
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-accent-blue flex items-center justify-center text-primary-dark font-semibold text-xl mr-4">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-neutral-text-primary">{name}</p>
          <p className="text-sm text-neutral-text-secondary">{title}</p>
        </div>
      </div>
    </Card>
  );
};

export default TestimonialCard; 