
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Add Toaster for potential notifications

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata for SEO and PWA
export const metadata: Metadata = {
  title: 'FaceVoiceAlbums',
  description: 'Automatically create albums based on faces and voices.',
  manifest: "/manifest.json", // Link to the PWA manifest
  themeColor: "#14b8a6", // Match theme color in manifest
   // Add icons for different platforms (optional but good practice)
   icons: {
    icon: "/icons/icon-192x192.png", // Default icon
    apple: "/icons/apple-touch-icon.png", // For Apple devices
   },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
         {/* Theme color meta tag is often added for PWAs */}
         <meta name="theme-color" content="#14b8a6" />
       </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}

