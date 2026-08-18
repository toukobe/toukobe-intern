import type { NextConfig } from "next";

// Supabase の接続先は環境変数から組み立てる（connect-src を https: 全開放にしないため）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");
const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy
// - script-src に 'unsafe-inline' が必要な理由: layout.tsx のJS判定スクリプトと
//   構造化データ(JSON-LD)、および Next.js 自身のブートストラップがインラインscriptのため。
//   nonce方式にすると middleware が必要になり全ページが動的レンダリングに落ちるので、
//   静的配信を優先してこの構成にしている（外部ドメインのscript読み込みは引き続き遮断される）。
// - 'unsafe-eval' は開発サーバー(Turbopack/HMR)でのみ許可し、本番では付けない。
// - img-src の blob: は求人カバー画像のアップロードプレビュー(URL.createObjectURL)に必要。
// - style-src の 'unsafe-inline' は style={{...}} を全面的に使っているため必須。
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl} ${supabaseWs}` : ""}${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
