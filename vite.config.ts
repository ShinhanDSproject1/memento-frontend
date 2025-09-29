import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import flowbiteReact from "flowbite-react/plugin/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import mkcert from "vite-plugin-mkcert";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const r = (p: string) => path.resolve(__dirname, p);

// dev https cert 안전 로딩 함수 (develop 브랜치 장점)
function devHttps() {
  try {
    const key = fs.readFileSync("localhost-key.pem");
    const cert = fs.readFileSync("localhost.pem");
    return { key, cert };
  } catch {
    // 인증서가 없으면 https를 사용하지 않음
    return undefined;
  }
}

export default defineConfig(({ mode }) => {
  // 현재 모드에 맞는 .env 파일을 로드
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production";

  return {
    plugins: [
      react(),
      tailwindcss(),
      flowbiteReact(),
      tsconfigPaths(),
      // 프로덕션 모드가 아닐 때만 mkcert 플러그인 활성화
      !isProd ? mkcert() : undefined,
    ],
    resolve: {
      alias: {
        "@": r("src"),
        "@app": r("src/app"),
        "@pages": r("src/pages"),
        "@widgets": r("src/widgets"),
        "@features": r("src/features"),
        "@entities": r("src/entities"),
        "@shared": r("src/shared"),
        "@assets": r("src/shared/assets"),
        "@hooks": r("src/shared/hooks"),
        "@lib": r("src/shared/lib"),
        "@ui": r("src/shared/ui"),
        "@api": r("src/shared/api"),
      },
    },
    define: {
      global: "window",
    },
    server: {
      https: devHttps(),
      host: true,
      port: 3000,
      open: "/memento-finance",
      proxy: {
        "/api/ai": {
          target: "http://192.168.0.180:8001",
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },

        "/api": {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const setCookie = proxyRes.headers["set-cookie"];
              if (!setCookie) return;

              const list = Array.isArray(setCookie) ? setCookie : [setCookie];
              proxyRes.headers["set-cookie"] = list.map((c) => {
                let v = c;
                v = v.replace(/;\s*SameSite=[^;]*/i, ""); // 기존 SameSite 제거
                if (!/;\s*Secure/i.test(v)) v += "; Secure";
                if (!/;\s*SameSite=/i.test(v)) v += "; SameSite=None";
                if (!/;\s*Path=/i.test(v)) v += "; Path=/";
                return v;
              });
            });
          },
        },

        // WebSocket 프록시 규칙
        "/ws/chat": {
          target: env.VITE_PROXY_TARGET.replace(/^http/, "ws"), // http -> ws
          ws: true,
          changeOrigin: true,
          secure: false,
        },

        // Stomp WebSocket 프록시 규칙
        "/ws-stomp": {
          target: "https://memento.shinhanacademy.co.kr",
          changeOrigin: true,
          secure: true,
          ws: true,
        },

        // Python 서버 프록시 규칙
        "/py": {
          target: "http://192.168.0.180:8001",
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/py/, ""),
        },
      },
    },
    assetsInclude: ["**/*.mp4", "**/*.ttf"],
  };
});
