'use client';

import { useState } from 'react';

export interface CustomField {
  label: string;
  value: string;
}

const MAX_FIELDS = 12;
const FF = 'var(--font-sans)';

// よく使われそうな項目名。クリックで項目名に入る（自由入力も可能）
const LABEL_SUGGESTIONS = [
  '1日の流れ',
  '身につくスキル',
  'インターン生の声',
  'チーム構成',
  '使用ツール',
  '入社後の流れ',
  'よくある質問',
];

const S = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' },
};

/**
 * 求人ごとに自由に追加できる項目（項目名＋本文）の編集UI。
 * 決まった項目に収まらない情報を、企業側が自分で足せるようにするためのもの。
 * 値は [{ label, value }] の配列で、jobs.custom_fields (jsonb) に保存する。
 */
export default function CustomFieldsEditor({
  value,
  onChange,
}: {
  value: CustomField[];
  onChange: (v: CustomField[]) => void;
}) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const update = (i: number, patch: Partial<CustomField>) => {
    onChange(value.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };
  const add = () => {
    if (value.length >= MAX_FIELDS) return;
    onChange([...value, { label: '', value: '' }]);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <p style={{ fontSize: 12.5, color: '#938B81', margin: '0 0 16px', lineHeight: 1.8 }}>
        上の項目に当てはまらない情報を、この求人だけに追加できます。入力した項目は求人ページの下部に、他の項目と同じ体裁で表示されます（{MAX_FIELDS}個まで）。
      </p>

      {value.length === 0 && (
        <div style={{ background: '#FBF8F4', border: '1px dashed #E9DFD2', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#938B81', fontSize: 13, marginBottom: 14 }}>
          追加した項目はまだありません
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {value.map((field, i) => (
          <div
            key={i}
            style={{ border: `1px solid ${focusedIndex === i ? '#F2620C' : '#EFE8DF'}`, borderRadius: 12, padding: '16px 18px', background: '#FBF8F4', transition: '.15s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#938B81', letterSpacing: '.06em' }}>項目 {i + 1}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="上へ"
                  style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 8, width: 30, height: 30, cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? '#D6CEC4' : '#57514A', fontSize: 13, lineHeight: 1 }}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} title="下へ"
                  style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 8, width: 30, height: 30, cursor: i === value.length - 1 ? 'not-allowed' : 'pointer', color: i === value.length - 1 ? '#D6CEC4' : '#57514A', fontSize: 13, lineHeight: 1 }}>↓</button>
                <button type="button" onClick={() => remove(i)} title="この項目を削除"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0 12px', height: 30, cursor: 'pointer', color: '#B91C1C', fontSize: 12, fontWeight: 700, fontFamily: FF }}>削除</button>
              </div>
            </div>

            <label style={S.label}>項目名</label>
            <input
              style={{ ...S.input, marginBottom: 10 }}
              value={field.label}
              onChange={e => update(i, { label: e.target.value })}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              placeholder="例: 1日の流れ"
              maxLength={30}
            />

            {!field.label && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {LABEL_SUGGESTIONS.map(s => (
                  <button key={s} type="button" onClick={() => update(i, { label: s })}
                    style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 999, border: '1px solid #FBD5B5', background: '#FFF3E9', color: '#C2530A', cursor: 'pointer', fontFamily: FF }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <label style={S.label}>内容</label>
            <textarea
              style={{ ...S.input, resize: 'vertical' }}
              value={field.value}
              onChange={e => update(i, { value: e.target.value })}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              placeholder={'例:\n10:00 出社・朝会\n11:00 顧客面談\n13:00 ランチ'}
              rows={4}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={value.length >= MAX_FIELDS}
        style={{ marginTop: 14, background: '#fff', border: '1px dashed #F2620C', color: '#C2530A', borderRadius: 10, padding: '12px 20px', fontFamily: FF, fontWeight: 700, fontSize: 13.5, cursor: value.length >= MAX_FIELDS ? 'not-allowed' : 'pointer', opacity: value.length >= MAX_FIELDS ? 0.5 : 1 }}
      >
        ＋ 項目を追加
      </button>
      {value.length >= MAX_FIELDS && (
        <span style={{ fontSize: 12, color: '#938B81', marginLeft: 12 }}>追加できるのは{MAX_FIELDS}個までです</span>
      )}
    </div>
  );
}

/** 保存前に、項目名か内容が空のものを落として整える */
export function cleanCustomFields(fields: CustomField[]): CustomField[] {
  return fields
    .map(f => ({ label: f.label.trim(), value: f.value.trim() }))
    .filter(f => f.label && f.value);
}
