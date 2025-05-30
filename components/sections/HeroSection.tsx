"use client"; // Required for Framer Motion components

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Button } from '@/components/ui/button'; // Shadcn UI Button
import { motion } from 'framer-motion'; // Import motion
import { Shovel } from 'lucide-react'; // Import the Shovel icon

// Animation Variants defined at the module scope
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 1.5, 
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 200,
    },
  },
};

// This component will only render its animated content on the client-side
const ClientOnlyVisuals = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const visualAreaRef = React.useRef<HTMLDivElement>(null); // Ref for drag constraints

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // On the server and initial client render, show a simple placeholder
  if (!hasMounted) {
    return (
      <div ref={visualAreaRef} className="w-full max-w-md h-64 md:h-96 bg-card-bg rounded-lg shadow-xl flex items-center justify-center relative overflow-hidden">
        {/* Static placeholder */}
      </div>
    );
  }

  // Once mounted on the client, render the full animations
  return (
    <div ref={visualAreaRef} className="w-full max-w-md h-64 md:h-96 bg-card-bg rounded-lg shadow-xl flex items-center justify-center relative overflow-hidden">
      {/* Animated shapes */}
      <motion.div
        className="absolute w-24 h-24 rounded-full opacity-50"
        style={{ backgroundColor: '#7DF9FF' }} // Direct hex for electric-blue
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, -20, 0],
          y: [0, -20, 20, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
      <motion.div
        className="absolute w-32 h-32 rounded-full opacity-50"
        style={{ backgroundColor: '#8B5CF6' }} // Direct hex for bright-purple
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -30, 30, 0],
          y: [0, 30, -30, 0],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 10,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute w-16 h-16 rounded-full opacity-50"
        style={{ backgroundColor: '#4FD1C5' }} // Direct hex for cool-teal
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 10, -10, 0],
          y: [0, -10, 10, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 7,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1,
        }}
      />
      {/* Animated Text "Groundwork" */}
      <motion.div 
        className="relative z-10 flex overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {Array.from("Groundwork").map((letter, index) => (
          <motion.span 
            key={index} 
            variants={letterVariants} 
            className="text-4xl font-bold text-neutral-text-primary"
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>

      {/* Draggable Shovel Icon */}
      <motion.div
        className="absolute z-20 cursor-grab active:cursor-grabbing"
        drag
        dragConstraints={visualAreaRef} // Constrain dragging to the parent div
        dragElastic={0.2}
        initial={{ x: -100, y: 50 }} // Initial position to the side
        whileTap={{ scale: 1.2, rotate: -15 }}
        // You can add whileHover effects too
      >
        <Shovel size={48} className="text-neutral-text-secondary hover:text-accent-blue transition-colors" />
      </motion.div>
    </div>
  );
};

const HeroSection = () => {
  return (
    <motion.section 
      className="py-20 md:py-32 bg-primary-dark"
      initial={{ opacity: 0, y: 20 }} // Initial state: invisible and slightly down
      animate={{ opacity: 1, y: 0 }}   // Animate to: fully visible and at original position
      transition={{ duration: 0.7, ease: "easeOut" }} // Animation duration and easing
    >
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
        {/* Left Column: Text content & CTA */}
        <motion.div 
          className="md:w-1/2 text-center md:text-left mb-10 md:mb-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-text-primary mb-6">
            Automate Your Workflows with AI
          </h1>
          <p className="text-lg sm:text-xl text-neutral-text-secondary mb-8">
            Connect your apps, build intelligent automations, and reclaim your time. Groundwork makes it simple.
          </p>
          <Button 
            size="lg" 
            className="bg-accent-blue hover:bg-opacity-90 text-neutral-text-primary font-semibold py-3 px-8 rounded-lg text-lg"
          >
            Get Started For Free
          </Button>
        </motion.div>

        {/* Right Column: Visuals */}
        <motion.div 
          className="md:w-1/2 flex justify-center items-center md:justify-end relative overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          <ClientOnlyVisuals />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection; 