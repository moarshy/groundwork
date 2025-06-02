"use client";

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CreateWorkflowButtonClientProps {
  href: string;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function CreateWorkflowButtonClient({ 
  href, 
  variant, 
  size, 
  className, 
  children,
  icon,
  disabled: propDisabled = false
}: CreateWorkflowButtonClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isButtonDisabled = isPending || propDisabled;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isButtonDisabled && !isPending) {
      e.preventDefault();
      return;
    }
    
    if (isPending || propDisabled) {
        e.preventDefault();
        return;
    }

    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link href={href} onClick={handleClick}>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isButtonDisabled}
        aria-disabled={isButtonDisabled}
      >
        {isPending ? (
          <Loader2 size={size === 'lg' ? 20 : (size === 'sm' ? 16 : 18)} className="mr-2 animate-spin" />
        ) : (
          icon
        )}
        {isPending ? 'Loading...' : children}
      </Button>
    </Link>
  );
} 