// Googleアナリティクス(GA4)の測定ID。
// 公開ページのHTMLに出る値なので秘密情報ではなく、ここに直接書いてよい。
// Vercelの環境変数 NEXT_PUBLIC_GA_ID を設定した場合はそちらが優先される。
// 計測を止めたいときは、この値を空文字にすればタグが一切出力されなくなる。
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-94C9H1C4ZT';
