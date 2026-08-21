import { supabase } from '@/utils/supabase';

export interface ShowcaseLogo {
  id: string;
  name: string;
  image_url: string;
  sort: number;
  visible: boolean;
}

/**
 * 表示用（公開ページ）：見せる設定のロゴだけを表示順で返す。
 * テーブル未作成（マイグレーション未実行）でも落ちないよう、失敗時は空配列。
 */
export async function fetchVisibleLogos(): Promise<ShowcaseLogo[]> {
  try {
    const { data, error } = await supabase
      .from('showcase_logos')
      .select('id, name, image_url, sort, visible')
      .eq('visible', true)
      .order('sort', { ascending: true });
    if (error) return [];
    return (data as ShowcaseLogo[]) || [];
  } catch {
    return [];
  }
}

/** 管理用：非表示も含めて全部を表示順で返す */
export async function fetchAllLogos(): Promise<ShowcaseLogo[]> {
  const { data, error } = await supabase
    .from('showcase_logos')
    .select('id, name, image_url, sort, visible')
    .order('sort', { ascending: true });
  if (error) throw error;
  return (data as ShowcaseLogo[]) || [];
}
