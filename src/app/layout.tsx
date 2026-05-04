import type { Metadata, Viewport } from 'next';
import './globals.css';
import LayoutClient from '@/components/LayoutClient';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "Eriyadan's Legacy",
  description: 'A private family tree — discover, connect and preserve your lineage.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Eriyadan's Legacy",
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0D1F0D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){var a=["bis_skin_checked","bis_register"];new MutationObserver(function(m){m.forEach(function(r){r.addedNodes.forEach(function(n){if(n.nodeType===1)a.forEach(function(x){if(n.hasAttribute&&n.hasAttribute(x))n.removeAttribute(x)})})})}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:a})})()` }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <LayoutClient>{children}</LayoutClient>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: { background: '#0D1F0D', border: '1px solid rgba(76,175,114,0.25)', color: '#E8F5E9' },
          }}
        />
      </body>
    </html>
  );
}