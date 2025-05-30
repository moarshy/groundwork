import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "./providers";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Groundwork - AI Workflow Automation",
  description: "Connect apps, build AI workflows, and automate tasks effortlessly.",
  icons: {
    icon: '/favicon.ico',
    // apple: '/apple-touch-icon.png', // Example for Apple touch icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className={"antialiased"}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
