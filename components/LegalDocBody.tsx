'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

// 管理者ページ（規約・ポリシータブ）で保存した文書を取得する。
// 未保存・空・テーブル未作成の場合は content が null になり、呼び出し側は組み込みの文面を表示する。
export function useSiteDocument(slug: string) {
  const [content, setContent] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from('site_documents')
      .select('content, updated_at')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content?.trim()) {
          setContent(data.content);
          setUpdatedAt(data.updated_at);
        }
      });
  }, [slug]);
  return { content, updatedAt };
}

type Block = { type: 'p'; text: string } | { type: 'bullets'; items: string[] };
interface Section { title: string | null; blocks: Block[] }

// プレーンテキストを条文カードに整形する。
// 「第◯条 …」「第◯章 …」で始まる行 = 見出し、「・」or「- 」で始まる行 = 箇条書き、それ以外 = 段落。
function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { title: null, blocks: [] };
  for (const raw of content.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^第[0-9０-９一二三四五六七八九十百]+(条|章)/.test(line)) {
      if (current.title !== null || current.blocks.length > 0) sections.push(current);
      current = { title: line, blocks: [] };
    } else if (/^(・|-\s)/.test(line)) {
      const item = line.replace(/^(・|-)\s*/, '');
      const last = current.blocks[current.blocks.length - 1];
      if (last && last.type === 'bullets') last.items.push(item);
      else current.blocks.push({ type: 'bullets', items: [item] });
    } else {
      current.blocks.push({ type: 'p', text: line });
    }
  }
  if (current.title !== null || current.blocks.length > 0) sections.push(current);
  return sections;
}

export default function LegalDocBody({ content, isMobile }: { content: string; isMobile: boolean }) {
  const sections = parseSections(content);
  const titled = sections.filter((s) => s.title);

  return (
    <>
      {titled.length > 1 && (
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F2620C', letterSpacing: '.14em', marginBottom: 14 }}>TABLE OF CONTENTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px 24px' }}>
            {titled.map((s) => (
              <a key={s.title} href={`#${s.title}`} style={{ fontSize: 13, color: '#57514A', textDecoration: 'none', display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: '#F2620C', fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0 }}>→</span>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {sections.map((s, si) => (
          <div key={si} id={s.title || undefined} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '20px 16px' : '32px 36px' }}>
            {s.title && (
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 18px', paddingBottom: 14, borderBottom: '2px solid #F2620C', display: 'inline-block' }}>{s.title}</h2>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {s.blocks.map((b, bi) =>
                b.type === 'p' ? (
                  <p key={bi} style={{ fontSize: 14, lineHeight: 1.9, color: '#3A352F', margin: 0 }}>{b.text}</p>
                ) : (
                  <ul key={bi} style={{ margin: '4px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {b.items.map((item, ii) => (
                      <li key={ii} style={{ fontSize: 14, lineHeight: 1.8, color: '#57514A' }}>{item}</li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
