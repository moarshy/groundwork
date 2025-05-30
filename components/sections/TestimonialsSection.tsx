import React from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import TestimonialCard, { TestimonialCardProps } from '@/components/ui/TestimonialCard';
// import { motion } from 'framer-motion'; // For animations later
// import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"; // For Shadcn Carousel

const testimonialsData: TestimonialCardProps[] = [
  {
    quote: "Groundwork has revolutionized how we handle our client onboarding. What used to take hours now takes minutes!",
    name: 'Sarah L.',
    title: 'Operations Manager, TechSolutions Inc.',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg', // Placeholder image
  },
  {
    quote: "The visual workflow builder is incredibly intuitive. Our non-technical team members were able to create complex automations with ease.",
    name: 'John B.',
    title: 'Head of Marketing, CreativeCo Agency',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg', // Placeholder image
  },
  {
    quote: "We\'ve seen a 30% reduction in manual data entry tasks since implementing Groundwork. It\'s a game-changer for our productivity.",
    name: 'Emily K.',
    title: 'CEO, FastGrowth Startups',
    avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg', // Placeholder image
  },
];

const TestimonialsSection = () => {
  // const useCarousel = false; // Set to true to try carousel layout

  return (
    <section className="py-16 md:py-24 bg-card-bg text-neutral-text-primary">
      <div className="container mx-auto px-6">
        <SectionTitle 
          title="Loved by Teams Worldwide"
          subtitle="Don\'t just take our word for it. Here\'s what our customers are saying about Groundwork."
        />
        {/* {useCarousel ? (
          <Carousel 
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {testimonialsData.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 p-4">
                  <TestimonialCard {...testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="ml-4 text-accent-blue bg-primary-dark hover:bg-accent-blue hover:text-primary-dark" />
            <CarouselNext className="mr-4 text-accent-blue bg-primary-dark hover:bg-accent-blue hover:text-primary-dark" />
          </Carousel>
        ) : ( */} 
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonialsData.map((testimonial, index) => (
              // Potential animation wrapper: <motion.div key={index} ... >
              <TestimonialCard 
                key={index}
                {...testimonial}
              />
              // </motion.div>
            ))}
          </div>
        {/* )} */}
      </div>
    </section>
  );
};

export default TestimonialsSection; 