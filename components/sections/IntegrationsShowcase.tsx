import React from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import Image from 'next/image'; // Import Next.js Image component

interface Integration {
  id: string;
  name: string;
  logoUrl: string; // Path to the logo in the /public directory
  alt: string;
}

// Updated list of integrations with hypothetical logo paths
const integrationsData: Integration[] = [
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    logoUrl: '/assets/images/logos/google-sheets.svg', // Example path
    alt: 'Google Sheets Logo',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    logoUrl: '/assets/images/logos/gmail.svg',
    alt: 'Gmail Logo',
  },
  {
    id: 'slack',
    name: 'Slack',
    logoUrl: '/assets/images/logos/slack.svg',
    alt: 'Slack Logo',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    logoUrl: '/assets/images/logos/instagram.svg',
    alt: 'Instagram Logo',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    logoUrl: '/assets/images/logos/twitter-x.svg',
    alt: 'Twitter X Logo',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    logoUrl: '/assets/images/logos/salesforce.svg',
    alt: 'Salesforce Logo',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    logoUrl: '/assets/images/logos/hubspot.svg',
    alt: 'HubSpot Logo',
  },
  {
    id: 'notion',
    name: 'Notion',
    logoUrl: '/assets/images/logos/notion.svg',
    alt: 'Notion Logo',
  },
  // Add more integrations as needed
];

const IntegrationsShowcase = () => {
  return (
    <section className="py-16 md:py-24 bg-primary-dark">
      <div className="container mx-auto px-6">
        <SectionTitle 
          title="Works with Your Favorite Tools"
          subtitle="Groundwork seamlessly integrates with a growing ecosystem of apps and services to automate your entire workflow."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 items-center">
          {integrationsData.map((integration) => (
            <div 
              key={integration.id} 
              title={integration.name} // Tooltip for the app name
              className="flex flex-col justify-center items-center p-4 sm:p-6 bg-card-bg rounded-lg shadow-lg h-32 sm:h-36 filter grayscale hover:grayscale-0 transition-all duration-300 ease-in-out aspect-square sm:aspect-video"
            >
              {/* 
                For this to work, you need to:
                1. Place the actual SVG files in /public/assets/images/logos/
                2. Ensure the filenames match those in integrationsData (e.g., google-sheets.svg)
                3. Add the relevant hostnames to next.config.js if logos are externally hosted (not needed for /public)
                4. SVGs might need specific width/height or viewBox attributes to render correctly with next/image.
                   Consider using a tool like SVGR if you want to import SVGs as React components for more control.
              */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <Image 
                  src={integration.logoUrl}
                  alt={integration.alt}
                  layout="fill"
                  objectFit="contain"
                  // onError={(e) => e.currentTarget.style.display = 'none'} // Hide if image fails to load
                />
              </div>
              <span className="text-neutral-text-secondary text-xs sm:text-sm text-center">{integration.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsShowcase; 