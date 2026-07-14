'use client';

import { useState } from 'react';
import { SKILL_GROUPS } from '@/utils/profileOptions';

// スキルをチップのタップで選択するピッカー。候補にないスキルは自由追加できる。
export default function SkillsPicker({ value, onChange }: { value: string[]; onChange: (skills: string[]) => void }) {
  const [custom, setCustom] = useState('');
  const selected = new Set(value);

  const toggle = (skill: string) => {
    if (selected.has(skill)) onChange(value.filter((s) => s !== skill));
    else onChange([...value, skill]);
  };

  const addCustom = () => {
    const s = custom.trim();
    if (!s || selected.has(s)) { setCustom(''); return; }
    onChange([...value, s]);
    setCustom('');
  };

  const chip = (skill: string, active: boolean) => (
    <button
      key={skill}
      type="button"
      onClick={() => toggle(skill)}
      style={{
        border: active ? '1.5px solid #F2620C' : '1px solid #EFE8DF',
        background: active ? '#FFF1E8' : '#fff',
        color: active ? '#C2530A' : '#57514A',
        fontWeight: active ? 700 : 500,
        borderRadius: 999,
        padding: '7px 14px',
        fontFamily: 'var(--font-sans)',
        fontSize: 12.5,
        cursor: 'pointer',
        transition: '.15s',
      }}
    >
      {active ? '✓ ' : ''}{skill}
    </button>
  );

  // 候補リストに無い（自由追加した）スキル
  const knownSkills = new Set(SKILL_GROUPS.flatMap((g) => g.skills));
  const customSkills = value.filter((s) => !knownSkills.has(s));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {SKILL_GROUPS.map((g) => (
        <div key={g.label}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#938B81', marginBottom: 8 }}>{g.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {g.skills.map((s) => chip(s, selected.has(s)))}
          </div>
        </div>
      ))}

      {customSkills.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#938B81', marginBottom: 8 }}>追加したスキル</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {customSkills.map((s) => chip(s, true))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder="リストにないスキルを入力して追加"
          style={{ flex: 1, border: '1px solid #EFE8DF', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#1C1813', outline: 'none', boxSizing: 'border-box' }}
          onFocus={(e) => (e.target.style.borderColor = '#F2620C')}
          onBlur={(e) => (e.target.style.borderColor = '#EFE8DF')}
        />
        <button type="button" onClick={addCustom} style={{ background: '#fff', color: '#F2620C', border: '1.5px solid #F2620C', borderRadius: 10, padding: '0 18px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          追加
        </button>
      </div>
    </div>
  );
}
