'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import {
  ADMIN_EMAIL,
  DEFAULT_SITE_MODE,
  MAINTENANCE_ALLOW_PREFIXES,
  NEVER_GATE_PREFIXES,
  PRELAUNCH_ALLOW_PREFIXES,
  pathMatchesPrefix,
  type SiteMode,
} from '@/utils/siteMode';

// 現在のサイトモードは1ページロード中に1回だけ取得してキャッシュする
let cachedMode: SiteMode | null = null;
let modePromise: Promise<SiteMode> | null = null;
function getSiteMode(): Promise<SiteMode> {
  if (cachedMode) return Promise.resolve(cachedMode);
  if (!modePromise) {
    modePromise = (async (): Promise<SiteMode> => {
      let resolved: SiteMode = DEFAULT_SITE_MODE;
      try {
        const { data, error } = await supabase
          .from('site_settings').select('site_mode').eq('id', 1).maybeSingle();
        const m = data?.site_mode;
        if (!error && (m === 'prelaunch' || m === 'maintenance')) resolved = m;
      } catch {
        resolved = DEFAULT_SITE_MODE;
      }
      cachedMode = resolved;
      return resolved;
    })();
  }
  return modePromise;
}

function Loader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4' }}>
      <div style={{ width: 34, height: 34, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'sg-spin 0.7s linear infinite' }} />
      <style>{`@keyframes sg-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const neverGate = pathMatchesPrefix(pathname, NEVER_GATE_PREFIXES);
  const [status, setStatus] = useState<'checking' | 'allow' | 'redirect'>(neverGate ? 'allow' : 'checking');

  // 公開モード以外では検索エンジンにインデックスさせない（robots.txt に加えた保険）
  useEffect(() => {
    getSiteMode().then((mode) => {
      const id = 'sitemode-noindex';
      const existing = document.getElementById(id) as HTMLMetaElement | null;
      if (mode !== 'public') {
        if (!existing) {
          const meta = document.createElement('meta');
          meta.id = id;
          meta.name = 'robots';
          meta.content = 'noindex,nofollow';
          document.head.appendChild(meta);
        }
      } else if (existing) {
        existing.remove();
      }
    });
  }, []);

  useEffect(() => {
    if (neverGate) { setStatus('allow'); return; }
    let active = true;
    (async () => {
      const mode = await getSiteMode();
      if (!active) return;
      if (mode === 'public') { setStatus('allow'); return; }

      const allow = mode === 'maintenance' ? MAINTENANCE_ALLOW_PREFIXES : PRELAUNCH_ALLOW_PREFIXES;
      if (pathMatchesPrefix(pathname, allow)) { setStatus('allow'); return; }

      // 管理者ログイン中はどのモードでも全画面を閲覧できる（商談・保守用バイパス）
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user?.email === ADMIN_EMAIL) { setStatus('allow'); return; }

      setStatus('redirect');
      router.replace(mode === 'maintenance' ? '/maintenance' : '/coming-soon');
    })();
    return () => { active = false; };
  }, [pathname, neverGate, router]);

  if (neverGate || status === 'allow') return <>{children}</>;
  return <Loader />;
}
