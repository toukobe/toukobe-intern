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

const PREVIEW_STORAGE = 'toukobe_site_preview'; // この端末がプレビュー許可済みか（キー値を保存）

type SiteData = { mode: SiteMode; previewKey: string | null };

// 現在のサイト設定は1ページロード中に1回だけ取得してキャッシュする
let cached: SiteData | null = null;
let dataPromise: Promise<SiteData> | null = null;
function getSiteData(): Promise<SiteData> {
  if (cached) return Promise.resolve(cached);
  if (!dataPromise) {
    dataPromise = (async (): Promise<SiteData> => {
      let result: SiteData = { mode: DEFAULT_SITE_MODE, previewKey: null };
      try {
        // preview_key 列が未追加の環境でも壊れないよう、失敗時は site_mode のみで再取得
        let res = await supabase.from('site_settings').select('site_mode, preview_key').eq('id', 1).maybeSingle();
        if (res.error && /preview_key|column/i.test(res.error.message)) {
          res = await supabase.from('site_settings').select('site_mode').eq('id', 1).maybeSingle() as typeof res;
        }
        const data = res.data as { site_mode?: string; preview_key?: string } | null;
        if (!res.error && data) {
          const m = data.site_mode;
          result = {
            mode: (m === 'prelaunch' || m === 'maintenance') ? m : DEFAULT_SITE_MODE,
            previewKey: data.preview_key ?? null,
          };
        }
      } catch {
        /* フォールバック（public）のまま */
      }
      cached = result;
      return result;
    })();
  }
  return dataPromise;
}

// プレビューリンク（?preview=キー）を開いた端末を許可する。以降はこの端末で保持。
function checkPreviewBypass(previewKey: string | null): boolean {
  if (!previewKey) return false;
  try {
    const url = new URL(window.location.href);
    const param = url.searchParams.get('preview');
    if (param !== null) {
      if (param === previewKey) {
        localStorage.setItem(PREVIEW_STORAGE, previewKey);
        url.searchParams.delete('preview');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        return true;
      }
      return false;
    }
    return localStorage.getItem(PREVIEW_STORAGE) === previewKey;
  } catch {
    return false;
  }
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
    getSiteData().then(({ mode }) => {
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
      const { mode, previewKey } = await getSiteData();
      if (!active) return;
      if (mode === 'public') { setStatus('allow'); return; }

      // プレビューリンクで許可された端末は全画面OK（ログイン不要・商談用）
      if (checkPreviewBypass(previewKey)) { setStatus('allow'); return; }

      const allow = mode === 'maintenance' ? MAINTENANCE_ALLOW_PREFIXES : PRELAUNCH_ALLOW_PREFIXES;
      if (pathMatchesPrefix(pathname, allow)) { setStatus('allow'); return; }

      // 管理者ログイン中はどのモードでも全画面を閲覧できる（保守用バイパス）
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
