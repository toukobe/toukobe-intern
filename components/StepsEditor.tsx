'use client';

import { useEffect, useRef, useState } from 'react';

// 選考プロセスなどの「工程数が可変」な項目を編集するエディタ。
// 各ステップはプリセットから選ぶことも、自由に入力することもできる。
// 値は改行区切りのテキストとして保存する（求人詳細ページでSTEP表示に整形される）。

const PRESET_STEPS = [
  'オンライン説明会への参加',
  'エントリーシートの提出',
  '書類選考',
  '適性検査・筆記試験',
  'グループディスカッション',
  'カジュアル面談',
  '面接（1回）',
  '面接（1〜2回）',
  '面接（複数回）',
  '最終面接',
  '内定',
];

const parse = (v: string): string[] => (v ? v.replace(/\r\n/g, '\n').split('\n').map(s => s.trim()).filter(Boolean) : []);
const serialize = (steps: string[]): string => steps.map(s => s.trim()).filter(Boolean).join('\n');

export default function StepsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [steps, setSteps] = useState<string[]>(() => parse(value));
  const lastValue = useRef(value);

  // 親の value が（非同期ロード等で）変わったら同期する
  useEffect(() => {
    if (value !== lastValue.current && value !== serialize(steps)) {
      setSteps(parse(value));
    }
    lastValue.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (next: string[]) => { setSteps(next); onChange(serialize(next)); };
  const setAt = (i: number, v: string) => update(steps.map((s, idx) => (idx === i ? v : s)));
  const removeAt = (i: number) => update(steps.filter((_, idx) => idx !== i));
  const add = () => update([...steps, '']);

  const inputStyle: React.CSSProperties = { flex: 1, minWidth: 0, border: '1px solid #EFE8DF', borderRadius: 10, padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.length === 0 && (
        <p style={{ fontSize: 12.5, color: '#B6ADA2', margin: 0 }}>「ステップを追加」で選考の工程を1つずつ登録してください。</p>
      )}
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flexShrink: 0, background: '#F2620C', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '6px 10px', whiteSpace: 'nowrap' }}>STEP{i + 1}</span>
          <input
            value={s}
            onChange={e => setAt(i, e.target.value)}
            placeholder="工程を入力（右のリストから選択も可）"
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#F2620C')}
            onBlur={e => (e.target.style.borderColor = '#EFE8DF')}
          />
          <select
            value=""
            onChange={e => { if (e.target.value) setAt(i, e.target.value); }}
            style={{ flexShrink: 0, width: 44, border: '1px solid #EFE8DF', borderRadius: 10, padding: '11px 6px', background: '#fff', cursor: 'pointer', color: '#57514A', fontSize: 13 }}
            title="プリセットから選ぶ"
          >
            <option value="">≡</option>
            {PRESET_STEPS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="button" onClick={() => removeAt(i)} title="このステップを削除" style={{ flexShrink: 0, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 10, width: 40, height: 42, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ alignSelf: 'flex-start', background: '#FFF1E8', color: '#F2620C', border: '1px dashed #FBD5C0', borderRadius: 10, padding: '10px 18px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
        ＋ ステップを追加
      </button>
    </div>
  );
}
