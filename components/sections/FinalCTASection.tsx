import React from 'react';
import { Button } from '@/components/ui/button'; // Shadcn UI Button
// import { motion } from 'framer-motion'; // For animations later

const FinalCTASection = () => {
  return (
    // <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
    <section className="py-20 md:py-32 bg-gradient-primary text-neutral-text-primary">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Ready to Transform Your Workflows?
        </h2>
        <p className="text-lg sm:text-xl text-neutral-text-primary opacity-90 mb-10 max-w-2xl mx-auto">
          Join thousands of businesses automating their way to success with Groundwork. 
          Start your free trial today and experience the future of work.
        </p>
        <Button 
          size="lg"
          className="bg-white hover:bg-neutral-text-secondary text-primary-dark font-semibold py-4 px-10 rounded-lg text-lg shadow-xl transform hover:scale-105 transition-transform duration-300 ease-in-out"
          // Example of a different style for the final CTA button
        >
          Start Your Free Trial
        </Button>
      </div>
    </section>
    // </motion.section>
  );
};

export default FinalCTASection; 