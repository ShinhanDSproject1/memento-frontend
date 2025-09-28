// src/shared/api/http.ts
import { clearAccessToken, getAccessToken, setAccessToken } from "@/shared/auth/token";
import axios, {
  AxiosHeaders,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL;
export const BASE_URL = typeof RAW_BASE === "string" && RAW_BASE.length > 0 ? RAW_BASE : "/api";

const LOGIN_PATH = "/auth/login";
const REFRESH_PATH = "/auth/reissue";

export interface AppRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean; // 이 요청이 리프레시 이후 재시도된 것인지
  _skipAuth?: boolean; // 인증 건너뛰기 플래그
  _hadAuth?: boolean; // 실제로 Authorization 헤더를 붙였는지
}

export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // RT 쿠키 포함
  timeout: 15_000,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

/** Authorization 헤더 부착 + 표식 */
function setAuthHeader(c: AppRequestConfig, token: string) {
  const headers =
    c.headers instanceof AxiosHeaders
      ? c.headers
      : new AxiosHeaders(c.headers as AxiosRequestHeaders | undefined);
  headers.set("Authorization", `Bearer ${token}`);
  c.headers = headers;
  c._hadAuth = true;
}

/* ----------------------------- Request 인터셉터 ----------------------------- */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const c = config as AppRequestConfig;

  // 인증 스킵
  if (c._skipAuth) return c;

  // 로그인/리프레시는 AT 불필요
  const url = c.url ?? "";
  if (url.startsWith(LOGIN_PATH) || url.startsWith(REFRESH_PATH)) return c;

  // AT 부착
  const token = getAccessToken();
  if (token) setAuthHeader(c, token);

  return c;
});

function isAuthError(status?: number) {
  return status === 401 || status === 419 || status === 440 || status === 498;
}

let refreshPromise: Promise<string> | null = null;

function refreshAccessTokenOnce(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post<{ result?: { accessToken: string } }>(BASE_URL + REFRESH_PATH, null, {
      withCredentials: true,
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
    .then((res) => {
      const t = res.data?.result?.accessToken;
      if (!t) throw new Error("No accessToken");
      setAccessToken(t);
      return t;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// ✅ 외부(Provider)에서 같은 Promise를 재사용할 수 있게 export
export function refreshSilently() {
  return refreshAccessTokenOnce();
}

http.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config as AppRequestConfig | undefined;
    if (!original || original._retry || !isAuthError(err.response?.status) || !original._hadAuth) {
      throw err;
    }

    // 리프레시 API 자체에서 난 에러면 그냥 실패 처리
    if ((original.url ?? "").endsWith(REFRESH_PATH)) {
      clearAccessToken();
      throw err;
    }
    original._retry = true;

    try {
      const newToken = await refreshAccessTokenOnce();

      const headers =
        original.headers instanceof AxiosHeaders
          ? original.headers
          : new AxiosHeaders(original.headers as AxiosRequestHeaders | undefined);
      headers.set("Authorization", `Bearer ${newToken}`);
      original.headers = headers;

      return http(original);
    } catch (e) {
      clearAccessToken();
      throw e;
    }
  },
);
