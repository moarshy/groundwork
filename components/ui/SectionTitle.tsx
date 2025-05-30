import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, className }) => {
  return (
    <div className={`mb-8 text-center ${className || ''}`}>
      <h2 className="text-3xl sm:text-4xl font-bold text-neutral-text-primary mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-neutral-text-secondary">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle; 