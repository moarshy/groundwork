"use client";

import React from "react";
import Sidebar from "./Sidebar"; 
import DashboardHeader from "./DashboardHeader";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  // activeSection state is no longer managed here.
  // Sidebar uses usePathname to determine active link.
  // DashboardHeader will also use usePathname to determine the title.

  return (
    <div className="flex h-screen bg-primary-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden text-foreground">
        <DashboardHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 