import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'CareerPilot — Your Agentic Career Co-pilot',
  description: 'AI platform that hunts jobs, scores your fit, drafts applications, and builds your learning roadmap.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-dark-900 text-white antialiased font-body">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
