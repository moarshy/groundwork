import React from 'react';
import Link from 'next/link';
// Placeholder for social icons, e.g., from lucide-react
// import { Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary-dark border-t border-card-bg text-neutral-text-secondary">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <Link href="/" className="text-xl font-semibold text-neutral-text-primary hover:text-accent-blue">
              Groundwork
            </Link>
            <p className="mt-2 text-sm">
              &copy; {new Date().getFullYear()} Groundwork. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-4 sm:mb-0">
            <Link href="/privacy-policy" className="hover:text-neutral-text-primary text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-neutral-text-primary text-sm">
              Terms of Service
            </Link>
          </div>
          <div className="flex space-x-4">
            {/* Placeholder for social icons */}
            {/* <Link href="#" className="hover:text-neutral-text-primary"><Facebook size={20} /></Link> */}
            {/* <Link href="#" className="hover:text-neutral-text-primary"><Twitter size={20} /></Link> */}
            {/* <Link href="#" className="hover:text-neutral-text-primary"><Linkedin size={20} /></Link> */}
            <span className="text-sm">Social Icons</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 