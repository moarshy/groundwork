"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';

interface CreateWorkflowButtonClientProps {
  href: string;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode; // Changed from React.ElementType to React.ReactNode
}

export default function CreateWorkflowButtonClient({ 
  href, 
  variant, 
  size, 
  className, 
  children,
  icon // Icon is now React.ReactNode
}: CreateWorkflowButtonClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const effectiveLoading = isLoading || isPending;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoading(true);
    startTransition(() => {
      router.push(href);
      // No need to setIsLoading(false) here as the component will likely unmount or re-render on navigation.
      // If navigation could fail and stay on the page, you might need to handle it.
    });
  };

  return (
    <Link href={href} onClick={handleClick} passHref legacyBehavior>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={effectiveLoading}
        aria-disabled={effectiveLoading}
      >
        {effectiveLoading ? (
          <Loader2 size={size === 'lg' ? 20 : 16} className="mr-2 animate-spin" />
        ) : (
          icon // Render the icon prop directly
        )}
        {effectiveLoading ? 'Loading...' : children}
      </Button>
    </Link>
  );
} 