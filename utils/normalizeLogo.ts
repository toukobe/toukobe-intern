// アップロードされたロゴ画像を、掲載用に自動で整える。
// - 高さを一定（既定 256px）にそろえてから保存するので、各社ロゴの解像度・サイズのばらつきが減り、
//   ロゴ帯できれいに並ぶ。
// - 大きすぎる画像は縮小してファイルを軽くする。小さい画像は無理に拡大しない（ぼやけ防止）。
// - SVG（ベクター）はそのまま返す（拡大しても劣化しないため加工不要）。
// クライアント専用（canvas を使う）。

export interface NormalizedLogo {
  blob: Blob;
  ext: string;
  width: number;
  height: number;
  /** 元画像が目標より小さく、拡大していない＝解像度が低い可能性 */
  lowRes: boolean;
}

const TARGET_HEIGHT = 256; // 表示は最大64px程度なので、Retina でも十分な高さ

export async function normalizeLogo(file: File): Promise<NormalizedLogo> {
  // SVG は加工せずそのまま（ベクターなので常に高画質）
  if (file.type === 'image/svg+xml') {
    return { blob: file, ext: 'svg', width: 0, height: 0, lowRes: false };
  }

  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    r.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('画像を解釈できませんでした'));
    i.src = dataUrl;
  });

  const nh = img.naturalHeight || img.height;
  const nw = img.naturalWidth || img.width;
  if (!nh || !nw) throw new Error('画像サイズを取得できませんでした');

  // 目標高さより大きければ縮小、小さければ等倍（拡大しない）
  const scale = nh > TARGET_HEIGHT ? TARGET_HEIGHT / nh : 1;
  const outH = Math.round(nh * scale);
  const outW = Math.round(nw * scale);
  const lowRes = nh < 96; // 元が極端に低解像度なら警告用フラグ

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('画像処理に失敗しました');
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, outW, outH); // 透過を保持
  ctx.drawImage(img, 0, 0, outW, outH);

  // 透過を保つため PNG で書き出す
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('画像の書き出しに失敗しました'))), 'image/png');
  });

  return { blob, ext: 'png', width: outW, height: outH, lowRes };
}
