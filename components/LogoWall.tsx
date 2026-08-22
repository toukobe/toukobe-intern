'use client';

import { useEffect, useState } from 'react';
import { fetchVisibleLogos, type ShowcaseLogo } from '@/utils/showcaseLogos';

// 掲載企業のロゴ帯。管理画面（サイト状態 → 掲載ロゴ）で登録したロゴを並べて表示する。
// 1件も登録が無いときは何も描画しない（空の見出しだけ残らないように）。
export default function LogoWall({
  title = '掲載企業',
  subtitle,
  background = '#fff',
}: {
  title?: string;
  subtitle?: string;
  background?: string;
}) {
  const [logos, setLogos] = useState<ShowcaseLogo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchVisibleLogos().then(l => { setLogos(l); setLoaded(true); });
  }, []);

  // 読み込み前・0件のときは何も出さない
  if (!loaded || logos.length === 0) return null;

  return (
    <section style={{ background, borderTop: '1px solid #F0EAE2', borderBottom: '1px solid #F0EAE2' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F2620C', letterSpacing: '.16em', marginBottom: 8 }}>COMPANIES</div>
          <h2 style={{ fontWeight: 900, fontSize: 20, margin: 0, color: '#1C1813' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: '#938B81', margin: '8px 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
          {logos.map(l => (
            // 各ロゴを同じ大きさの白いカードに入れる。
            // 透過ロゴにも背景が付き、比率の違うロゴでも大きさ・余白がそろって並ぶ。
            <div key={l.id} title={l.name}
              style={{ height: 96, width: 208, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, boxShadow: '0 2px 8px rgba(28,24,19,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px', boxSizing: 'border-box' }}>
              <img
                src={l.image_url}
                alt={l.name || '掲載企業ロゴ'}
                loading="lazy"
                style={{ maxHeight: 56, maxWidth: 164, width: 'auto', objectFit: 'contain', display: 'block' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
