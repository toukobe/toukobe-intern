import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'トウコべインターン',
    short_name: 'トウコべインターン',
    description: '難関大生に特化した長期インターンマッチングサービス',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF7F0',
    theme_color: '#F2620C',
    icons: [
      { src: '/icon.png', sizes: '256x256', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
