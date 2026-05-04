import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eriyadan's Legacy — Family Tree",
    short_name: 'Eriyadan',
    description: 'Explore and preserve your family lineage across generations',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D1F0D',
    theme_color: '#0D1F0D',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
