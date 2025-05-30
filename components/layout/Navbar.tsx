import React from 'react';
import Link from 'next/link';
import AuthStatus from './AuthStatus';

const Navbar = () => {
  return (
    <nav className="bg-card-bg shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div>
          <Link href="/" className="text-xl font-semibold text-neutral-text-primary hover:text-accent-blue">
            Groundwork
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {/* Placeholder for Nav Links */}
          <Link href="/#features" className="text-neutral-text-secondary hover:text-neutral-text-primary">
            Features
          </Link>
          <Link href="/#how-it-works" className="text-neutral-text-secondary hover:text-neutral-text-primary">
            How it Works
          </Link>
          <Link href="/#pricing" className="text-neutral-text-secondary hover:text-neutral-text-primary">
            Pricing
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <AuthStatus />
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 