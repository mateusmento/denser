import {
  CreateDocumentInput,
  CreateDocumentResponse,
  CreateSpaceInput,
  CreateSpaceResponse,
  DocumentConflictResponse,
  GetDocumentResponse,
  HomeResponse,
  PatchDocumentInput,
  PatchDocumentResponse,
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SpaceDetailResponse,
  type ArtifactId,
  type SpaceId,
} from "@denser/contracts";
import { HealthResponse, MeResponse, Session, type SignInInput } from "@denser/contracts";
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

export class ApiConflictError extends ApiError {
  readonly conflict: DocumentConflictResponse;

  constructor(body: DocumentConflictResponse) {
    super("conflict", 409, body);
    this.name = "ApiConflictError";
    this.conflict = body;
  }
}

export { SEED_ARTIFACT_ONBOARDING_NOTES };

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
    const res = await this.request("/api/auth/get-session");
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("session failed", res.status, body);
    if (!body || typeof body !== "object") {
      return Session.parse({});
    }
    const payload = body as { user?: Session["user"] };
    return Session.parse(payload.user ? { user: payload.user } : {});
  }

  async me(): Promise<MeResponse> {
    const res = await this.request("/api/me");
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("me failed", res.status, body);
    return MeResponse.parse(body);
  }

  async signIn(input: SignInInput): Promise<void> {
    const res = await this.request("/api/auth/sign-in/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: input.username,
        password: input.password,
      }),
    });

    if (!res.ok) {
      throw new ApiError("sign-in failed", res.status, await this.parseJson(res));
    }
  }

  async signOut(): Promise<void> {
    const res = await this.request("/api/auth/sign-out", { method: "POST" });
    if (!res.ok) {
      throw new ApiError("sign-out failed", res.status, await this.parseJson(res));
    }
  }

  async home(): Promise<HomeResponse> {
    const res = await this.request("/api/home");
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("home failed", res.status, body);
    return HomeResponse.parse(body);
  }

  async createSpace(input: CreateSpaceInput): Promise<CreateSpaceResponse> {
    const res = await this.request("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("create space failed", res.status, body);
    return CreateSpaceResponse.parse(body);
  }

  async getSpace(spaceId: SpaceId): Promise<SpaceDetailResponse> {
    const res = await this.request(`/api/spaces/${spaceId}`);
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("get space failed", res.status, body);
    return SpaceDetailResponse.parse(body);
  }

  async createDocument(input: CreateDocumentInput = {}): Promise<CreateDocumentResponse> {
    const res = await this.request("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("create document failed", res.status, body);
    return CreateDocumentResponse.parse(body);
  }

  async getDocument(artifactId: ArtifactId): Promise<GetDocumentResponse> {
    const res = await this.request(`/api/documents/${artifactId}`);
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("get document failed", res.status, body);
    return GetDocumentResponse.parse(body);
  }

  async patchDocument(
    artifactId: ArtifactId,
    input: PatchDocumentInput,
  ): Promise<PatchDocumentResponse> {
    const res = await this.request(`/api/documents/${artifactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (res.status === 409) {
      throw new ApiConflictError(DocumentConflictResponse.parse(body));
    }
    if (!res.ok) throw new ApiError("patch document failed", res.status, body);
    return PatchDocumentResponse.parse(body);
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
