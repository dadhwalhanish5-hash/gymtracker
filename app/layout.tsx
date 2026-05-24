// app/layout.tsx
// This is the ROOT LAYOUT — it wraps EVERY page in the app
// Think of it like the frame of a picture — every page sits inside it

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GymTracker — Om & Pinky',
  description: 'Personal gym progression tracker',
  manifest: '/manifest.json',
  themeColor: '#07070f',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // 'children' = whatever page is being shown
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
