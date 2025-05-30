"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Zap,
  Bot,
  History,
  Settings,
  LogOut,
  Rocket,
  ClipboardList
} from 'lucide-react';

const menuItems = [
  { name: "Workflows", icon: LayoutDashboard, path: "/dashboard/workflows" },
  { name: "Connect", icon: Zap, path: "/dashboard/connect" },
  { name: "Agents", icon: Bot, path: "/dashboard/agents" },
  { name: "Workflow Runs", icon: ClipboardList, path: "/dashboard/runs" },
  // { name: "Event History", icon: History, path: "/dashboard/history" },
  // { name: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="w-64 bg-card-bg p-4 flex flex-col space-y-2 border-r border-neutral-text-secondary/10">
      {/* User/Workspace Info - Conditional rendering based on isMounted and session */}
      <div className="mb-6 pt-2">
        {isMounted && session?.user && (
          <>
            {session.user.image && (
              <Image 
                src={session.user.image} 
                alt={session.user.name || "User avatar"} 
                width={40} 
                height={40} 
                className="rounded-full mx-auto mb-2" 
                referrerPolicy="no-referrer" 
              />
            )}
            <p className="text-center text-sm font-semibold text-neutral-text-primary">
              {session.user.name || session.user.email}
            </p>
          </>
        )}
        {/* Always render this part, or also gate it if it causes issues */}
        <p className="text-center text-xs text-neutral-text-secondary">Your Workspace</p>
      </div>

      {/* Main Navigation - Generally safe, relies on pathname which should be consistent */}
      <nav className="flex-grow">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <li key={item.name}>
                <Link 
                  href={item.path} 
                  className={`w-full flex items-center space-x-3 p-2.5 rounded-md text-sm hover:bg-accent-blue/20 transition-colors duration-150 ${
                    isActive
                      ? "bg-accent-blue text-white font-medium shadow-sm"
                      : "text-neutral-text-secondary hover:text-neutral-text-primary"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section (Plan/Usage - Placeholder) */}
      <div className="mt-auto pt-4 border-t border-neutral-text-secondary/10">
         <div className="p-3 bg-primary-dark rounded-lg mb-3">
            <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-neutral-text-secondary">Credits Used</span>
                <span className="font-medium text-neutral-text-primary">0/100</span>
            </div>
            <div className="w-full bg-neutral-text-secondary/20 rounded-full h-1.5">
                <div className="bg-accent-blue h-1.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
         </div>
         <button className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-md text-sm bg-gradient-primary text-white hover:opacity-90 transition-opacity">
            <Rocket size={16} />
            <span>Upgrade Plan</span>
         </button>
      </div>

      {/* Help & Billing Links - if bottomMenuItems is used */}
      {/* <nav className="mt-2">
        <ul>
          {bottomMenuItems.map((item) => (
            <li key={item.name}>
              <Link href={item.path} legacyBehavior>
                <a className="w-full flex items-center space-x-3 p-2.5 rounded-md text-xs text-neutral-text-secondary hover:text-neutral-text-primary hover:bg-primary-dark/70 transition-colors duration-150">
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav> */}

      {/* Sign Out */}
      <button
        onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after sign out
        className="w-full flex items-center space-x-3 p-2.5 mt-2 rounded-md text-sm text-neutral-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150"
      >
        <LogOut size={18} />
        <span>Sign Out</span>
      </button>
    </div>
  );
} 