import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout"; // Adjust path if necessary
import React from "react";
import { Toaster } from "@/components/ui/sonner"; // Shadcn usually puts it here

export default async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  // If session exists, render the DashboardLayout with the children
  return (
    <DashboardLayout>
      {children}
      <Toaster richColors position="top-right" />
    </DashboardLayout>
  );
} 