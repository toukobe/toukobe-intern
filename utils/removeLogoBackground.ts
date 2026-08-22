// ロゴ画像の「白以外の背景」を透過に抜く。
// 画像の四隅から同じ色の領域だけを塗りつぶし式(flood fill)で消すので、
// ロゴ本体に同色があっても、外周とつながっていない限り残る。
// クライアント専用（canvas を使う）。

export interface RemoveBgResult {
  blob: Blob;
  changed: boolean; // 背景を実際に抜いたか（元から透過などで変化なしなら false）
}

/** 画像 Blob を受け取り、外周の背景色を透過にした PNG を返す */
export async function removeLogoBackground(src: Blob): Promise<RemoveBgResult> {
  const url = URL.createObjectURL(src);
  try {
    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('画像を読み込めませんでした'));
      i.src = url;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error('画像サイズを取得できませんでした');

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('画像処理に失敗しました');
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const idx = (x: number, y: number) => (y * w + x) * 4;

    // 背景色は四隅の平均で推定。すでに透過している隅があれば背景抜きは不要。
    const corners = [idx(0, 0), idx(w - 1, 0), idx(0, h - 1), idx(w - 1, h - 1)];
    if (corners.some(i => px[i + 3] < 240)) {
      return { blob: src, changed: false }; // 既に透過あり → そのまま
    }
    let br = 0, bg = 0, bb = 0;
    for (const i of corners) { br += px[i]; bg += px[i + 1]; bb += px[i + 2]; }
    br = Math.round(br / 4); bg = Math.round(bg / 4); bb = Math.round(bb / 4);

    const TOL = 42; // 背景とみなす色の許容差
    const near = (i: number) =>
      Math.abs(px[i] - br) + Math.abs(px[i + 1] - bg) + Math.abs(px[i + 2] - bb) <= TOL * 3;

    // 外周ピクセルを起点に flood fill（背景色に近い連結領域だけ透過）
    const visited = new Uint8Array(w * h);
    const stack: number[] = [];
    const pushIf = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (visited[p]) return;
      visited[p] = 1;
      if (near(p * 4)) stack.push(p);
    };
    for (let x = 0; x < w; x++) { pushIf(x, 0); pushIf(x, h - 1); }
    for (let y = 0; y < h; y++) { pushIf(0, y); pushIf(w - 1, y); }

    let removed = 0;
    while (stack.length) {
      const p = stack.pop()!;
      px[p * 4 + 3] = 0; // 透過
      removed++;
      const x = p % w, y = (p / w) | 0;
      pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
    }

    if (removed === 0) return { blob: src, changed: false };

    ctx.putImageData(data, 0, 0);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('画像の書き出しに失敗しました'))), 'image/png');
    });
    return { blob, changed: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}
