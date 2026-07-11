'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';
import SiteFooter from '@/components/SiteFooter';

const problems = [
  { title: '優秀な学生からの応募が来ない', desc: '求人を掲載しても難関大生からの応募は限定的。採用しても、期待した戦力にならないことも。' },
  { title: '選考の人的コストが膨らむ', desc: '面接を重ねても、なかなか合う学生に出会えない。選考工数だけが増えていく。' },
  { title: '新卒採用につながらない', desc: 'インターン採用が、その後の新卒採用の成果に結びつかない。' },
  { title: '採用コストが高く、採算が取れない', desc: '初期費用・月額費用で合計30万円以上かかるサービスもあり、割に合わないことが多い。' },
];

const features = [
  { title: '東大・京大生 約1,500名に直接リーチ', desc: '親会社が運営するオンライン個別指導「トウコベ」の学生ネットワークに直接アプローチ。最初から難関大生だけの母集団です。※' },
  { title: '中心は講師経験のある学生 ＝ 人柄・コミュ力に強み', desc: '学生基盤の中心は、採用選考を通過し、実際にご家庭から選ばれ続けている「トウコベ」講師の学生です。講師経験のある学生は、履歴書では分からない「人柄・責任感・伝える力」が指導実績で裏付けられています。※講師以外の難関大生も登録します。' },
  { title: '学部2・3年生が中心 ＝ 卒業まで1.5〜2年', desc: '長期就業を経て新卒採用へ接続できる時間軸を持った学生層。インターン → 内定の導線を最初から設計できます。' },
  { title: '採用管理ダッシュボード', desc: '応募者の一覧・ステータス管理をWeb上で完結。応募者の連絡先メールにそのまま連絡でき、選考工数を削減できます。' },
];

const flow = [
  { no: '01', title: '資料請求・お問い合わせ', desc: '資料請求フォームよりお気軽にご連絡ください。担当者より1営業日以内にご連絡します。' },
  { no: '02', title: 'ご契約', desc: '契約書をお送りします。ご確認のうえ、サインをお願いします。' },
  { no: '03', title: '求人ページ作成', desc: '必要な情報をご提出いただき、弊社にて求人ページを作成します。' },
  { no: '04', title: '求人公開', desc: '企業アカウントから、求人の新規作成・編集が可能になります。' },
];

const faqs = [
  { q: 'どのタイミングで料金が発生しますか？', a: 'ご契約時に初期費用100,000円（税抜）を申し受けます。契約開始から2〜3ヶ月目は無料で、無料期間終了後は月額40,000円（税抜）でのご継続となります。' },
  { q: 'なぜ東大生・京大生にアプローチできるのですか？', a: '親会社が運営するオンライン個別指導「トウコベ」の講師学生 約1,500名にリーチ済みで、サービス開始と同時に登録をご案内するためです。' },
  { q: '求人情報を修正できますか？', a: '法人アカウントにてログインいただければ、何度でも自由に求人情報を編集可能です。' },
  { q: '新しいサービスですが、実績はありますか？', a: '2026年8月開始の新サービスです。掲載企業が少ない初期は、貴社の求人が学生の目に留まりやすくなります。' },
];

export default function ForCompaniesPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = '企業の方へ | トウコべインターン';
    return () => { document.title = 'トウコべインターン | 難関大生に特化した長期インターン'; };
  }, []);

  const goMaterial = () => router.push('/forms/material');

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '16px 48px', background: 'rgba(255,255,255,.92)', borderBottom: '1px solid #EFE8DF', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 38, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/auth/company-login')}>企業ログイン</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: '10px 22px', cursor: 'pointer' }} onClick={goMaterial}>資料請求</span>
        </div>
      </div>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(120deg,#1C1813 0%,#2A231B 100%)', padding: isMobile ? '60px 20px 52px' : '88px 48px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(242,98,12,.3) 0%,rgba(242,98,12,0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#FBA94C', letterSpacing: '.18em', marginBottom: 14 }}>FOR COMPANIES</div>
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 30 : 46, color: '#fff', margin: '0 0 20px', lineHeight: 1.4 }}>東大生 × 優良企業の<br />マッチングプラットフォーム</h1>
          <p style={{ fontSize: 16, color: '#C9C0B6', margin: '0 0 16px', lineHeight: 1.8 }}>東大生に特化した長期インターン求人プラットフォーム。<br />優秀な人材との出会いが、貴社の成長を支えます。</p>
          <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: '#FBA94C', border: '1px solid rgba(251,169,76,.45)', borderRadius: 999, padding: '6px 18px', marginBottom: 36 }}>2026年8月 サービス開始｜掲載企業を募集中</div>
          <div>
            <button onClick={goMaterial} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '18px 52px', borderRadius: 12, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 6px 18px rgba(242,98,12,.4)' }}>
              資料を請求する
            </button>
          </div>
        </div>
      </div>

      {/* PROBLEMS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>PROBLEM</div>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>長期インターン採用に、<br />こんなお悩みはありませんか？</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 20 }}>
          {problems.map((p, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '26px 26px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF1E8', color: '#C2390A', fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>!</div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>{p.title}</h3>
                <p style={{ fontSize: 13.5, color: '#57514A', lineHeight: 1.8, margin: 0 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontWeight: 700, fontSize: isMobile ? 15 : 17, margin: '40px 0 0', color: '#1C1813' }}>
          その課題、<span style={{ color: '#F2620C' }}>「講師経験者を中心とした難関大生」</span>が解決します。
        </p>
      </div>

      {/* FEATURES */}
      <div style={{ background: '#FBF8F4', padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>FEATURES</div>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>選ばれる理由</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '32px 30px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F2620C', color: '#fff', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontFamily: "var(--font-mono)" }}>0{i + 1}</div>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: '0 0 10px', lineHeight: 1.5 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.85, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#938B81', margin: '20px 4px 0', lineHeight: 1.7 }}>
            ※ 親会社「トウコベ」の学生データ（社内集計）に基づく参考値です。本サービスの登録者数ではありません。
          </p>
        </div>
      </div>

      {/* STUDENT BASE */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>STUDENT BASE</div>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>学生基盤は、東大生講師ネットワーク「トウコベ」</h2>
        </div>
        <p style={{ fontSize: 15, color: '#57514A', lineHeight: 2, margin: '0 0 28px', textAlign: 'center' }}>
          「トウコベ」は、親会社・株式会社MANABIが運営する東大生講師によるオンライン個別指導サービスです。<br />
          講師は採用選考を通過し、実際にご家庭から選ばれ続けている学生。<br />
          こうした指導実績を持つ学生層を中心に、幅広い難関大生へ直接アプローチできます。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 16, maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#7A7268', marginBottom: 8 }}>既にリーチ済みの東大・京大の学生</div>
            <div style={{ fontWeight: 900, fontSize: 34, color: '#F2620C' }}>約1,500<span style={{ fontSize: 16, color: '#1C1813', marginLeft: 4 }}>名</span></div>
          </div>
          <div style={{ background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#7A7268', marginBottom: 8 }}>学部2・3年生が中心</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#1C1813', lineHeight: '46px' }}>卒業まで長期就業が可能</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#938B81', margin: '16px auto 0', maxWidth: 720, lineHeight: 1.7 }}>
          ※ 親会社「トウコベ」の学生データ（社内集計）に基づく参考値。本サービスの登録者数ではありません。
        </p>
      </div>

      {/* PRICING */}
      <div style={{ background: '#FBF8F4', padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>PRICE</div>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>2〜3ヶ月目は無料。<br />シンプルな料金体系です。</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', justifyContent: 'center', gap: 16, margin: '40px 0 12px' }}>
            <div style={{ flex: 1, maxWidth: isMobile ? 'none' : 340, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#7A7268', marginBottom: 8 }}>初期費用（ご契約時に一度のみ・税抜）</div>
              <div style={{ fontWeight: 900, fontSize: 32 }}>100,000<span style={{ fontSize: 15, marginLeft: 4 }}>円</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: '#938B81' }}>＋</div>
            <div style={{ flex: 1, maxWidth: isMobile ? 'none' : 340, background: '#fff', border: '2px solid #F2620C', borderRadius: 16, padding: '28px 24px', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#F2620C', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 14px', whiteSpace: 'nowrap' }}>2〜3ヶ月目は無料</div>
              <div style={{ fontSize: 13, color: '#7A7268', marginBottom: 8 }}>月額掲載料（4ヶ月目以降・税抜）</div>
              <div style={{ fontWeight: 900, fontSize: 32 }}>月額 40,000<span style={{ fontSize: 15, marginLeft: 4 }}>円</span></div>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#938B81', margin: '0 0 40px' }}>金額はいずれも税抜価格です。求人掲載数にかかわらず、料金は一律です。</p>

          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 24px', maxWidth: 560, margin: '0 auto' }}>
            <h3 style={{ fontWeight: 700, fontSize: 17, margin: '0 0 12px' }}>月額プランの内容</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: '#57514A', lineHeight: 2 }}>
              <li>月額 40,000円（税抜）で掲載を継続</li>
              <li>何名採用しても追加費用なしの定額制</li>
              <li>30日前までのご連絡で、いつでも解約可能</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FLOW */}
      <div style={{ padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>FLOW</div>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>掲載開始まで、かんたん4ステップ</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {flow.map((s, i) => (
              <div key={s.no} style={{ display: 'flex', gap: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F2620C', color: '#fff', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "var(--font-mono)" }}>{s.no}</div>
                  {i < flow.length - 1 && <div style={{ width: 2, flex: 1, background: '#EFE8DF', margin: '8px 0' }} />}
                </div>
                <div style={{ paddingBottom: i < flow.length - 1 ? 40 : 0, paddingTop: 8, flex: 1 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.85, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: '#FBF8F4', padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>よくあるご質問</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '24px 26px' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15.5, margin: '0 0 10px', display: 'flex', gap: 10 }}>
                  <span style={{ color: '#F2620C', fontWeight: 900, flexShrink: 0 }}>Q.</span>{f.q}
                </h3>
                <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.9, margin: 0, display: 'flex', gap: 10 }}>
                  <span style={{ color: '#938B81', fontWeight: 900, flexShrink: 0 }}>A.</span><span>{f.a}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: isMobile ? '56px 16px' : '84px 48px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 30, margin: '0 0 14px' }}>まずは資料請求から</h2>
        <p style={{ fontSize: 15, color: '#7A7268', margin: '0 0 32px', lineHeight: 1.9 }}>
          サービス概要・料金・掲載フローをまとめた資料をお送りします。<br />
          お申込み・ご不明点も、フォームよりお気軽にご連絡ください。
        </p>
        <button onClick={goMaterial} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '18px 56px', borderRadius: 12, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 6px 18px rgba(242,98,12,.4)' }}>
          資料を請求する →
        </button>
        <div style={{ marginTop: 24 }}>
          <button onClick={() => router.push('/auth/company-login')} style={{ background: 'transparent', color: '#938B81', border: 'none', padding: '10px 0', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}>
            すでにアカウントをお持ちの方はこちら
          </button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
