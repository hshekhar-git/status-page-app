import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Status Page',
  description: 'Monitor your services status in real-time',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <WebSocketProvider debug={process.env.NODE_ENV === 'development'}>
            {children}
            <Toaster position="top-right" />
          </WebSocketProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}