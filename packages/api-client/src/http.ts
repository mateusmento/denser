import {
  HealthResponse,
  MeResponse,
  Session,
  type SignInInput,
} from "@denser/contracts";
import { connectSocket, type DenserSocket } from "./socket.js";

export type ApiClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
  getCookieHeader?: () => Promise<string> | string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly getCookieHeader: (() => Promise<string> | string) | undefined;
  private socket: DenserSocket | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? fetch.bind(globalThis);
    this.getCookieHeader = options.getCookieHeader;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (this.getCookieHeader) {
      const cookie = await this.getCookieHeader();
      if (cookie) headers.set("cookie", cookie);
    }
    return this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  }

  private async parseJson(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  async health(): Promise<{ ok: true }> {
    const res = await this.request("/api/health");
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("health failed", res.status, body);
    return HealthResponse.parse(body);
  }

  async session(): Promise<Session> {
    const res = await this.request("/api/auth/session");
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("session failed", res.status, body);
    return Session.parse(body ?? {});
  }

  async me(): Promise<MeResponse> {
    const res = await this.request("/api/me");
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("me failed", res.status, body);
    return MeResponse.parse(body);
  }

  async signIn(input: SignInInput): Promise<void> {
    const csrfRes = await this.request("/api/auth/csrf");
    if (!csrfRes.ok) {
      throw new ApiError("csrf failed", csrfRes.status, await this.parseJson(csrfRes));
    }
    const csrf = (await this.parseJson(csrfRes)) as { csrfToken?: string };
    if (!csrf.csrfToken) {
      throw new Error("csrfToken missing from /api/auth/csrf");
    }

    const body = new URLSearchParams({
      csrfToken: csrf.csrfToken,
      username: input.username,
      password: input.password,
      json: "true",
    });

    const res = await this.request("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "manual",
    });

    if (res.status >= 400) {
      throw new ApiError("sign-in failed", res.status, await this.parseJson(res));
    }
  }

  async connectRealtime(): Promise<DenserSocket> {
    if (this.socket?.connected) return this.socket;
    const cookieHeader = this.getCookieHeader ? await this.getCookieHeader() : undefined;
    this.socket = await connectSocket({
      baseUrl: this.baseUrl,
      ...(cookieHeader ? { cookieHeader } : {}),
    });
    return this.socket;
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
