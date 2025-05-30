"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Using Shadcn Button

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Wait until the component has mounted on the client to render the dynamic UI
  if (!hasMounted) {
    // Render a placeholder or null during SSR and initial client render
    // This could be a div with fixed dimensions to prevent layout shifts
    return <div className="h-10 w-48"></div>; // Example placeholder
  }

  if (status === "loading" && !session) {
    // Show a more specific loading state if not yet mounted but status is loading
    // and we don't have a session (to avoid flicker if session is already there)
    return <div className="h-10 w-48 flex items-center justify-center"><p className="text-sm text-neutral-text-secondary">Loading...</p></div>;
  }

  if (session) {
    return (
      <div className="flex items-center space-x-3">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User avatar"}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div>
          <p className="text-sm font-medium text-neutral-text-primary">
            {session.user?.name || session.user?.email}
          </p>
          {/* <p className="text-xs text-neutral-text-secondary">Signed In</p> */}
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
          Sign out
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center space-x-2">
      {/* <p className="text-sm text-neutral-text-secondary">Not signed in</p> */}
      <Button variant="default" size="sm" onClick={() => signIn("google", { callbackUrl: '/dashboard' })}>
        Sign in with Google
      </Button>
    </div>
  );
} 