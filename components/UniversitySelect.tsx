'use client';

import { useState } from 'react';
import { UNIVERSITY_OPTIONS, UNIVERSITY_OTHER } from '@/utils/profileOptions';

// 大学の選択（プリセット＋その他自由入力）。
// プリセットにない大学名は「その他（自由入力）」を選ぶとテキスト入力できる。
export default function UniversitySelect({
  value,
  onChange,
  selectStyle,
  inputStyle,
  required = false,
}: {
  value: string;
  onChange: (v: string) => void;
  selectStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  required?: boolean;
}) {
  const isPreset = UNIVERSITY_OPTIONS.includes(value);
  // 値がプリセットに無い（＝自由入力 or 未入力で「その他」を選んだ）状態を保持
  const [otherMode, setOtherMode] = useState<boolean>(!!value && !isPreset);
  const showOther = otherMode || (!!value && !isPreset);
  const selectValue = isPreset ? value : showOther ? UNIVERSITY_OTHER : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select
        style={selectStyle}
        value={selectValue}
        required={required && !showOther}
        onChange={(e) => {
          const v = e.target.value;
          if (v === UNIVERSITY_OTHER) {
            setOtherMode(true);
            onChange('');
          } else {
            setOtherMode(false);
            onChange(v);
          }
        }}
      >
        <option value="">選択してください</option>
        {UNIVERSITY_OPTIONS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
        <option value={UNIVERSITY_OTHER}>その他（自由入力）</option>
      </select>

      {showOther && (
        <input
          style={inputStyle}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder="大学名を入力（例：〇〇大学）"
          autoFocus
        />
      )}
    </div>
  );
}
