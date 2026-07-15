'use client';

// テキストエリアの上に置く「クリックで1行追加」できるプリセットチップ。
// 選択肢から選ぶ／自由に書く のどちらも使えるようにするための補助UI。
export default function QuickInsertChips({ options, value, onChange }: { options: string[]; value: string; onChange: (next: string) => void }) {
  const lines = (value || '').split('\n').map(l => l.replace(/^・\s*/, '').trim());
  const has = (o: string) => lines.includes(o);

  const insert = (o: string) => {
    if (has(o)) return;
    const trimmed = (value || '').replace(/\s+$/, '');
    const next = trimmed ? `${trimmed}\n・${o}` : `・${o}`;
    onChange(next);
  };

  if (options.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
      {options.map(o => {
        const on = has(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => insert(o)}
            disabled={on}
            style={{
              fontSize: 12,
              padding: '5px 12px',
              borderRadius: 999,
              border: `1px solid ${on ? '#BBF7D0' : '#EFE8DF'}`,
              background: on ? '#F0FDF4' : '#fff',
              color: on ? '#15803D' : '#57514A',
              fontFamily: 'var(--font-sans)',
              cursor: on ? 'default' : 'pointer',
              transition: '.15s',
            }}
          >
            {on ? '✓ ' : '＋ '}{o}
          </button>
        );
      })}
    </div>
  );
}
