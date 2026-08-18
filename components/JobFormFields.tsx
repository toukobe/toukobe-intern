'use client';

import { TOKYO_AREAS, PREFECTURES } from '@/utils/constants';
import StepsEditor from '@/components/StepsEditor';
import SkillsPicker from '@/components/SkillsPicker';
import QuickInsertChips from '@/components/QuickInsertChips';
import CustomFieldsEditor, { type CustomField } from '@/components/CustomFieldsEditor';
import { FIELD_PRESETS } from '@/utils/jobPresets';
import { useState } from 'react';

// 求人フォームの入力欄をまとめたコンポーネント。
// 「求人を投稿」と「求人を編集」で同じものを使うことで、項目・並び順・必須の扱いが
// 2画面でズレないようにしている（以前は同じフォームが2ファイルに複製されていた）。

export const JOB_CATEGORIES = ['コンサルティング','経営・企画','金融・ファイナンス','マーケティング','エンジニア','デザイナー','営業','ライター・メディア','経理','人事・広報','事務・アシスタント','その他'];
export const WORK_DAYS = ['週2から','週3から','週4から'];
export const WORK_CONDITIONS = ['フルリモート','一部リモート','フレックス勤務','土日勤務可'];
export const JOB_FEATURES = ['未経験OK','交通費支給','服装髪型自由'];

export interface JobFormValue {
  job_title: string;
  salary: string;
  location: string;
  job_description: string;
  job_categories: string[];
  work_days: string[];
  work_conditions: string[];
  job_features: string[];
  // 応募条件
  required_conditions: string;
  welcome_conditions: string;
  ideal_candidate: string;
  // 働き方
  shift_info: string;
  employment_type: string;
  address: string;
  // 選考・入社後
  selection_process: string;
  training: string;
  benefits: string;
  alumni_placements: string;
  intern_count: string;
  // タグ・自由項目
  feature_tags: string[];
  custom_fields: CustomField[];
}

export const EMPTY_JOB_FORM: JobFormValue = {
  job_title: '', salary: '', location: '', job_description: '',
  job_categories: [], work_days: [], work_conditions: [], job_features: [],
  required_conditions: '', welcome_conditions: '', ideal_candidate: '',
  shift_info: '', employment_type: '', address: '',
  selection_process: '', training: '', benefits: '', alumni_placements: '', intern_count: '',
  feature_tags: [], custom_fields: [],
};

/** 未入力の必須項目があればエラーメッセージを返す（無ければ null） */
export function validateJobForm(v: JobFormValue): string | null {
  if (!v.job_title.trim()) return '職種名を入力してください';
  if (!v.salary.trim()) return '給与を入力してください';
  if (!v.location.trim()) return '勤務地を入力してください';
  if (!v.job_description.trim()) return '業務内容を入力してください';
  if (!v.required_conditions.trim()) return '必須条件を入力してください';
  if (v.job_categories.length === 0) return '職種カテゴリを1つ以上選んでください（学生が検索で見つけるために必要です）';
  return null;
}

const FF = 'var(--font-sans)';
const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' },
  section: { background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 32px', marginBottom: 20 } as React.CSSProperties,
};

function Badge({ required }: { required?: boolean }) {
  return required ? (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#C2530A', background: '#FFF3E9', border: '1px solid #FBD5B5', borderRadius: 999, padding: '2px 8px', marginLeft: 8, verticalAlign: 'middle' }}>必須</span>
  ) : (
    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#938B81', background: '#F5F0EB', border: '1px solid #EFE8DF', borderRadius: 999, padding: '2px 8px', marginLeft: 8, verticalAlign: 'middle' }}>任意</span>
  );
}

function SectionTitle({ children, required, note }: { children: React.ReactNode; required?: boolean; note?: string }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #EFE8DF' }}>
      <span style={{ fontWeight: 900, fontSize: 16, color: '#1C1813' }}>{children}</span>
      <Badge required={required} />
      {note && <p style={{ fontSize: 12.5, color: '#938B81', margin: '10px 0 0', lineHeight: 1.8 }}>{note}</p>}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={F.label}>
      {children}
      {required && <span style={{ color: '#F2620C', marginLeft: 4 }}>*</span>}
    </label>
  );
}

function Chips({ options, selected, onToggle, columns }: { options: string[]; selected: string[]; onToggle: (v: string) => void; columns?: string }) {
  return (
    <div style={columns ? { display: 'grid', gridTemplateColumns: columns, gap: 10 } : { display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map(o => {
        const sel = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => onToggle(o)}
            style={{ border: sel ? '2px solid #F2620C' : '1px solid #EFE8DF', background: sel ? '#FFF1E8' : '#fff', color: sel ? '#F2620C' : '#57514A', borderRadius: 8, padding: columns ? '10px 14px' : '10px 20px', fontFamily: FF, fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer', textAlign: columns ? 'left' : 'center' }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function JobFormFields({
  value,
  onChange,
  tagOptions,
  isMobile,
}: {
  value: JobFormValue;
  onChange: (v: JobFormValue) => void;
  tagOptions: string[];
  isMobile: boolean;
}) {
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const set = <K extends keyof JobFormValue>(key: K, v: JobFormValue[K]) => onChange({ ...value, [key]: v });
  const toggle = (key: 'job_categories' | 'work_days' | 'work_conditions' | 'job_features', v: string) => {
    const cur = value[key];
    set(key, cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
  };

  const textarea = (key: keyof JobFormValue, label: string, ph: string, rows: number, required = false) => (
    <div key={key as string}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {FIELD_PRESETS[key as string] && (
        <QuickInsertChips options={FIELD_PRESETS[key as string]} value={value[key] as string} onChange={v => set(key, v as JobFormValue[typeof key])} />
      )}
      <textarea
        style={{ ...F.input, resize: 'vertical' }}
        value={value[key] as string}
        onChange={e => set(key, e.target.value as JobFormValue[typeof key])}
        placeholder={ph}
        rows={rows}
        onFocus={e => ((e.target as HTMLTextAreaElement).style.borderColor = '#F2620C')}
        onBlur={e => ((e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF')}
      />
    </div>
  );

  return (
    <>
      {/* ① 基本情報（必須） */}
      <div style={F.section}>
        <SectionTitle required note="ここは求人一覧・検索結果に出る部分です。すべて入力してください。">基本情報</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FieldLabel required>職種名</FieldLabel>
            <input style={F.input} value={value.job_title} onChange={e => set('job_title', e.target.value)} placeholder="例: Webエンジニア、マーケティングアシスタント"
              onFocus={e => ((e.target as HTMLInputElement).style.borderColor = '#F2620C')}
              onBlur={e => ((e.target as HTMLInputElement).style.borderColor = '#EFE8DF')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <FieldLabel required>給与</FieldLabel>
              <input style={F.input} value={value.salary} onChange={e => set('salary', e.target.value)} placeholder="例: 時給1,500〜2,000円"
                onFocus={e => ((e.target as HTMLInputElement).style.borderColor = '#F2620C')}
                onBlur={e => ((e.target as HTMLInputElement).style.borderColor = '#EFE8DF')} />
              <p style={{ fontSize: 11.5, color: '#938B81', margin: '6px 0 0' }}>「時給」「月給」と金額を入れると、Google検索の結果にも給与が表示されます</p>
            </div>
            <div style={{ position: 'relative' }}>
              <FieldLabel required>勤務地（都道府県）</FieldLabel>
              <input
                style={F.input}
                value={value.location}
                onChange={e => {
                  const v = e.target.value;
                  set('location', v);
                  setLocationSuggestions(v ? PREFECTURES.filter(p => p.includes(v)) : []);
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#F2620C'; setLocationSuggestions(value.location ? PREFECTURES.filter(p => p.includes(value.location)) : []); }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'; setTimeout(() => setLocationSuggestions([]), 150); }}
                placeholder="例: 東京都、大阪府"
              />
              {locationSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 50, maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
                  {locationSuggestions.map(p => (
                    <div
                      key={p}
                      onMouseDown={() => { set('location', p); setLocationSuggestions([]); }}
                      style={{ padding: '10px 16px', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #F5F0EB' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FFF6EE')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >{p}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 東京エリア選択 */}
          {value.location.includes('東京') && (
            <div style={{ background: '#FFF6EE', border: '1px solid #FBD5C0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#F2620C', fontWeight: 700, marginBottom: 10 }}>🗼 東京 詳細エリア（クリックで入力欄に追加）</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TOKYO_AREAS.map(a => (
                  <button key={a} type="button" onClick={() => set('location', `東京都${a}`)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: '1px solid #FBD5C0', background: value.location.includes(a) ? '#F2620C' : '#fff', color: value.location.includes(a) ? '#fff' : '#57514A', fontFamily: FF, cursor: 'pointer', transition: '.15s' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 勤務地のすぐ下に置く（以前は離れた位置にあって入力しづらかった） */}
          <div>
            <FieldLabel>勤務地の詳細住所</FieldLabel>
            <input style={F.input} value={value.address} onChange={e => set('address', e.target.value)} placeholder="例: 東京都 千代田区 内幸町2-1-6"
              onFocus={e => ((e.target as HTMLInputElement).style.borderColor = '#F2620C')}
              onBlur={e => ((e.target as HTMLInputElement).style.borderColor = '#EFE8DF')} />
          </div>

          <div>
            <FieldLabel required>業務内容</FieldLabel>
            <textarea style={{ ...F.input, resize: 'vertical' }} value={value.job_description} onChange={e => set('job_description', e.target.value)} placeholder="具体的な業務内容を詳しく記載してください" rows={6}
              onFocus={e => ((e.target as HTMLTextAreaElement).style.borderColor = '#F2620C')}
              onBlur={e => ((e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF')} />
          </div>

          {/* 検索の絞り込みに直結するため基本情報に置き、必須にしている */}
          <div>
            <FieldLabel required>職種カテゴリ</FieldLabel>
            <p style={{ fontSize: 11.5, color: '#938B81', margin: '-2px 0 10px' }}>学生はここから求人を探します。複数選択できます。</p>
            <Chips options={JOB_CATEGORIES} selected={value.job_categories} onToggle={v => toggle('job_categories', v)} columns={isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'} />
          </div>
        </div>
      </div>

      {/* ② 応募条件 */}
      <div style={F.section}>
        <SectionTitle required note="「応募要件」と「必須条件」で同じことを2回書く形になっていたため、必須条件に一本化しました。">応募条件</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {textarea('required_conditions', '必須条件', '例:\n・基礎的なPCスキルやコミュニケーションスキル\n・週15時間以上稼働できる方', 4, true)}
          {textarea('welcome_conditions', '歓迎条件', '例:\n・半年以上の勤務ができる方\n・団体のリーダー経験がある方', 3)}
          {textarea('ideal_candidate', '求める人物像', '例:\n・主体的に業務に取り組み、裁量を持って働きたい方\n・結果に妥協しない環境で成長したい方', 4)}
        </div>
      </div>

      {/* ③ 働き方 */}
      <div style={F.section}>
        <SectionTitle note="選んだ条件は、学生の検索の絞り込みに使われます。">働き方</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>勤務日数</div>
            <Chips options={WORK_DAYS} selected={value.work_days} onToggle={v => toggle('work_days', v)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>勤務形態</div>
            <Chips options={WORK_CONDITIONS} selected={value.work_conditions} onToggle={v => toggle('work_conditions', v)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>求人の特徴</div>
            <Chips options={JOB_FEATURES} selected={value.job_features} onToggle={v => toggle('job_features', v)} />
          </div>
          {textarea('shift_info', 'シフト', '例: 週15時間以上稼働できる方を募集しています。\n学業の状況に合わせて柔軟にシフト変動できます。', 3)}
          <div>
            <FieldLabel>雇用形態</FieldLabel>
            <input style={F.input} value={value.employment_type} onChange={e => set('employment_type', e.target.value)} placeholder="例: インターン契約"
              onFocus={e => ((e.target as HTMLInputElement).style.borderColor = '#F2620C')}
              onBlur={e => ((e.target as HTMLInputElement).style.borderColor = '#EFE8DF')} />
          </div>
        </div>
      </div>

      {/* ④ 選考・入社後 */}
      <div style={F.section}>
        <SectionTitle note="入力した項目だけが求人ページに表示されます。充実させるほど応募につながりやすくなります。">選考・入社後</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FieldLabel>選考プロセス</FieldLabel>
            <StepsEditor value={value.selection_process} onChange={v => set('selection_process', v)} />
          </div>
          {textarea('training', '研修・教育制度', '例: 入社後は先輩メンバーから手厚いサポートが受けられます。', 3)}
          {textarea('benefits', '福利厚生', '例:\n・交通費支給\n・昇給制度あり', 3)}
          {textarea('alumni_placements', 'インターン卒業生の内定実績', '例: 過去に弊社でインターンをしていた学生は、以下のような企業に内定しています。\n・外資系コンサルティングファーム\n・大手商社', 3)}
          <div>
            <FieldLabel>インターン生の在籍数</FieldLabel>
            <input style={F.input} value={value.intern_count} onChange={e => set('intern_count', e.target.value)} placeholder="例: 30人在籍（※2026年1月時点）"
              onFocus={e => ((e.target as HTMLInputElement).style.borderColor = '#F2620C')}
              onBlur={e => ((e.target as HTMLInputElement).style.borderColor = '#EFE8DF')} />
          </div>
        </div>
      </div>

      {/* ⑤ 特徴タグ */}
      <div style={F.section}>
        <SectionTitle note="当てはまるタグを選んでください（自由に追加も可能）。学生はこのタグで求人を検索できます。">特徴タグ</SectionTitle>
        <SkillsPicker value={value.feature_tags} onChange={v => set('feature_tags', v)} groups={[{ label: '求人の特徴タグ', skills: tagOptions }]} addPlaceholder="タグを追加（例: 事業立案）" />
      </div>

      {/* ⑥ この求人だけの項目 */}
      <div style={F.section}>
        <SectionTitle note={undefined}>この求人だけの項目</SectionTitle>
        <CustomFieldsEditor value={value.custom_fields} onChange={v => set('custom_fields', v)} />
      </div>
    </>
  );
}
