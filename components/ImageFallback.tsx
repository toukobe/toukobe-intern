'use client';

import { useEffect } from 'react';

// 画像が読み込めなかったときの全アプリ共通フォールバック。
// 目的: スマホの一時的な通信断や、削除済みストレージ画像のURL切れなどで
//       「壊れた画像アイコン」が出続ける状態をなくす。
// 挙動: 失敗時にまず1回だけ再取得（transientな失敗を救う）→ それでも駄目なら
//       中立なプレースホルダー画像に差し替える（壊れアイコンは絶対に出さない）。

// 中立なプレースホルダー（暖色の下地＋淡い画像アイコン）。カバーにもロゴ枠にも馴染む。
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#F3EEE7"/><g fill="none" stroke="#CBB9A8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><rect x="180" y="116" width="120" height="92" rx="10"/><circle cx="212" cy="150" r="12"/><path d="M186 202 L228 164 L252 188 L276 160 L296 178"/></g></svg>`;
const PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;

export default function ImageFallback() {
  useEffect(() => {
    const onError = (e: Event) => {
      const img = e.target as HTMLImageElement | null;
      if (!img || img.tagName !== 'IMG') return;
      // すでにプレースホルダー化済みなら何もしない（無限ループ防止）
      if (img.src.startsWith('data:')) return;

      const retries = Number(img.dataset.imgRetry || '0');
      if (retries < 1) {
        // 一時的な失敗を想定して1回だけ再取得（キャッシュ回避のためクエリを付与）
        img.dataset.imgRetry = '1';
        const base = img.src.split('#')[0];
        const sep = base.includes('?') ? '&' : '?';
        const retryUrl = `${base}${sep}_retry=${retries + 1}`;
        // 少し待ってから再試行（瞬断からの復帰を待つ）
        window.setTimeout(() => { img.src = retryUrl; }, 600);
      } else {
        // 再試行しても駄目 → 中立プレースホルダーへ
        img.src = PLACEHOLDER;
      }
    };
    // 画像の load 失敗はバブリングしないため capture フェーズで拾う
    window.addEventListener('error', onError, true);
    return () => window.removeEventListener('error', onError, true);
  }, []);

  return null;
}
