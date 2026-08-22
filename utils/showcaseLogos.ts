import { supabase } from '@/utils/supabase';

export interface ShowcaseLogo {
  id: string;
  name: string;
  image_url: string;
  sort: number;
  visible: boolean;
  /** 表示倍率（1.0 = 標準）。1社ずつ大きさを調整するために使う */
  scale: number;
  /** 背景透過の前の画像URL（あれば「元に戻す」で復元できる） */
  prev_image_url?: string | null;
}

// select('*') で取得することで、後から足したカラム（scale / prev_image_url）が
// 未マイグレーションの環境でもエラーにならない（無ければ undefined になるだけ）。
function normalize(rows: Record<string, unknown>[]): ShowcaseLogo[] {
  return rows.map(r => ({
    id: r.id as string,
    name: (r.name as string) ?? '',
    image_url: r.image_url as string,
    sort: (r.sort as number) ?? 0,
    visible: (r.visible as boolean) ?? true,
    scale: typeof r.scale === 'number' && r.scale > 0 ? (r.scale as number) : 1,
    prev_image_url: (r.prev_image_url as string) ?? null,
  }));
}

/** 表示用（公開ページ）：見せる設定のロゴだけを表示順で返す。テーブル未作成なら空配列。 */
export async function fetchVisibleLogos(): Promise<ShowcaseLogo[]> {
  try {
    const { data, error } = await supabase
      .from('showcase_logos')
      .select('*')
      .eq('visible', true)
      .order('sort', { ascending: true });
    if (error) return [];
    return normalize((data as Record<string, unknown>[]) || []);
  } catch {
    return [];
  }
}

/** 管理用：非表示も含めて全部を表示順で返す */
export async function fetchAllLogos(): Promise<ShowcaseLogo[]> {
  const { data, error } = await supabase
    .from('showcase_logos')
    .select('*')
    .order('sort', { ascending: true });
  if (error) throw error;
  return normalize((data as Record<string, unknown>[]) || []);
}
