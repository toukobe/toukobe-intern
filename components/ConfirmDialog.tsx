'use client';

import { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  /** 見出し。「◯◯を削除します」のように、何が起きるかを言い切る */
  title: string;
  /** 補足の説明文 */
  description?: React.ReactNode;
  /** 一緒に消えるものの一覧（応募データなど）。空なら非表示 */
  items?: string[];
  /** 指定するとこの文字列を正確に入力しないと実行できない（企業名など、取り返しのつかない削除用） */
  confirmWord?: string;
  /** 「元に戻せないことを理解しました」のチェックを必須にする */
  requireAck?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 実行中。ボタンを無効化し、閉じられなくする */
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 削除など取り返しのつかない操作の確認ダイアログ。
 * ブラウザ標準の confirm() は Enter 連打で誤って通ってしまうため、
 * 重い操作では confirmWord（名前の入力）や requireAck（チェック）を必須にして誤操作を防ぐ。
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  items,
  confirmWord,
  requireAck = false,
  confirmLabel = '削除する',
  cancelLabel = 'キャンセル',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [acked, setAcked] = useState(false);

  // 開くたびに入力状態をリセット（前回の入力が残っていると確認の意味がなくなる）。
  // useEffect ではなくレンダー中に前回値と比較して調整する（React 推奨の書き方）
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTyped('');
      setAcked(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const wordOk = !confirmWord || typed.trim() === confirmWord.trim();
  const ackOk = !requireAck || acked;
  const canConfirm = wordOk && ackOk && !busy;

  const FF = 'var(--font-sans)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => { if (!busy) onCancel(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,24,19,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, padding: '32px 32px 28px', maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(28,24,19,.24)', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 14px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 8v5" /><path d="M12 16.5v.5" />
            </svg>
          </div>
          <h3 style={{ fontWeight: 900, fontSize: 19, margin: 0, color: '#B91C1C', lineHeight: 1.4 }}>{title}</h3>
        </div>

        {description && (
          <div style={{ fontSize: 14, color: '#57514A', lineHeight: 1.9, margin: '0 0 14px' }}>{description}</div>
        )}

        {items && items.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', margin: '0 0 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', marginBottom: 6 }}>一緒に削除されるデータ</div>
            <ul style={{ fontSize: 13, color: '#57514A', lineHeight: 1.9, margin: 0, paddingLeft: 18 }}>
              {items.map(it => <li key={it}>{it}</li>)}
            </ul>
          </div>
        )}

        {confirmWord && (
          <div style={{ margin: '0 0 16px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#57514A', marginBottom: 8, lineHeight: 1.7 }}>
              確認のため <strong style={{ color: '#1C1813' }}>{confirmWord}</strong> と入力してください
            </label>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              disabled={busy}
              placeholder={confirmWord}
              style={{ width: '100%', border: `1px solid ${typed && !wordOk ? '#FECACA' : '#EFE8DF'}`, borderRadius: 10, padding: '12px 14px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {requireAck && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: busy ? 'not-allowed' : 'pointer', userSelect: 'none', margin: '0 0 18px' }}>
            <input
              type="checkbox"
              checked={acked}
              disabled={busy}
              onChange={e => setAcked(e.target.checked)}
              style={{ width: 17, height: 17, accentColor: '#B91C1C', cursor: busy ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#57514A', lineHeight: 1.6 }}>元に戻せないことを理解しました</span>
          </label>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{ flex: 1, background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{ flex: 1, background: canConfirm ? '#B91C1C' : '#E7C9C9', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: canConfirm ? 'pointer' : 'not-allowed' }}
          >
            {busy ? '処理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
