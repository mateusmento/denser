import {
  AddSpaceMemberInput,
  AddSpaceMemberResponse,
  AttachmentDto,
  CompleteConversationUploadResponse,
  ConversationConflictResponse,
  CreateConversationInput,
  CreateConversationResponse,
  CreateDirectConversationInput,
  CreateDirectConversationResponse,
  CreateDocumentInput,
  CreateDocumentResponse,
  CreateSpaceInput,
  CreateSpaceResponse,
  DocumentConflictResponse,
  EditMessageInput,
  GetConversationResponse,
  GetDocumentResponse,
  GetUnreadSummaryResponse,
  MarkConversationReadResponse,
  UnreadConversationSummary,
  ListDirectConversationsResponse,
  ListMessagesQuery,
  ListMessagesResponse,
  ListThreadMessagesQuery,
  MessageDraftDto,
  PatchConversationInput,
  PostMessageInput,
  PostMessageResponse,
  ToggleReactionInput,
  ToggleReactionResponse,
  PatchConversationResponse,
  EnableSprintsResponse,
  HomeResponse,
  PatchDocumentInput,
  PatchDocumentResponse,
  PatchDocumentTypeInput,
  PatchDocumentTypeResponse,
  PatchSpaceInput,
  PatchSpaceResponse,
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SpaceDetailResponse,
  StartConversationUploadInput,
  StartConversationUploadResponse,
  UpsertMessageDraftInput,
  type ArtifactId,
  type AttachmentId,
  type ClientId,
  type DocumentTypeId,
  type MessageId,
  type SpaceId,
  type UserId,
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

export class ApiConversationConflictError extends ApiError {
  readonly conflict: ConversationConflictResponse;

  constructor(body: ConversationConflictResponse) {
    super("conflict", 409, body);
    this.name = "ApiConversationConflictError";
    this.conflict = body;
  }
}

export class ApiMessageDraftConflictError extends ApiError {
  readonly draft: MessageDraftDto | null;

  constructor(body: { draft?: MessageDraftDto | null }) {
    super("conflict", 409, body);
    this.name = "ApiMessageDraftConflictError";
    this.draft = body.draft ?? null;
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
    const res = await this.request("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
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

  async patchSpace(spaceId: SpaceId, input: PatchSpaceInput): Promise<PatchSpaceResponse> {
    const res = await this.request(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("patch space failed", res.status, body);
    return PatchSpaceResponse.parse(body);
  }

  async enableSprints(spaceId: SpaceId): Promise<EnableSprintsResponse> {
    const res = await this.request(`/api/spaces/${spaceId}/sprints/enable`, { method: "POST" });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("enable sprints failed", res.status, body);
    return EnableSprintsResponse.parse(body);
  }

  async startSprint(spaceId: SpaceId): Promise<EnableSprintsResponse> {
    const res = await this.request(`/api/spaces/${spaceId}/sprints/start`, { method: "POST" });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("start sprint failed", res.status, body);
    return EnableSprintsResponse.parse(body);
  }

  async completeSprint(spaceId: SpaceId): Promise<EnableSprintsResponse> {
    const res = await this.request(`/api/spaces/${spaceId}/sprints/complete`, { method: "POST" });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("complete sprint failed", res.status, body);
    return EnableSprintsResponse.parse(body);
  }

  async duplicateDocument(artifactId: ArtifactId): Promise<CreateDocumentResponse> {
    const res = await this.request(`/api/documents/${artifactId}/duplicate`, { method: "POST" });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("duplicate document failed", res.status, body);
    return CreateDocumentResponse.parse(body);
  }

  async deleteSpace(spaceId: SpaceId): Promise<void> {
    const res = await this.request(`/api/spaces/${spaceId}`, { method: "DELETE" });
    if (!res.ok) {
      throw new ApiError("delete space failed", res.status, await this.parseJson(res));
    }
  }

  async addSpaceMember(
    spaceId: SpaceId,
    input: AddSpaceMemberInput,
  ): Promise<AddSpaceMemberResponse> {
    const res = await this.request(`/api/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("add space member failed", res.status, body);
    return AddSpaceMemberResponse.parse(body);
  }

  async removeSpaceMember(spaceId: SpaceId, memberUserId: UserId): Promise<void> {
    const res = await this.request(`/api/spaces/${spaceId}/members/${memberUserId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new ApiError("remove space member failed", res.status, await this.parseJson(res));
    }
  }

  async patchDocumentType(
    documentTypeId: DocumentTypeId,
    input: PatchDocumentTypeInput,
  ): Promise<PatchDocumentTypeResponse> {
    const res = await this.request(`/api/document-types/${documentTypeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("patch document type failed", res.status, body);
    return PatchDocumentTypeResponse.parse(body);
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

  async deleteDocument(artifactId: ArtifactId): Promise<void> {
    const res = await this.request(`/api/documents/${artifactId}`, { method: "DELETE" });
    if (!res.ok) {
      throw new ApiError("delete document failed", res.status, await this.parseJson(res));
    }
  }

  async createConversation(
    input: CreateConversationInput = {},
  ): Promise<CreateConversationResponse> {
    const res = await this.request("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("create conversation failed", res.status, body);
    return CreateConversationResponse.parse(body);
  }

  async getConversation(artifactId: ArtifactId): Promise<GetConversationResponse> {
    const res = await this.request(`/api/conversations/${artifactId}`);
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("get conversation failed", res.status, body);
    return GetConversationResponse.parse(body);
  }

  async patchConversation(
    artifactId: ArtifactId,
    input: PatchConversationInput,
  ): Promise<PatchConversationResponse> {
    const res = await this.request(`/api/conversations/${artifactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (res.status === 409) {
      throw new ApiConversationConflictError(ConversationConflictResponse.parse(body));
    }
    if (!res.ok) throw new ApiError("patch conversation failed", res.status, body);
    return PatchConversationResponse.parse(body);
  }

  async deleteConversation(artifactId: ArtifactId): Promise<void> {
    const res = await this.request(`/api/conversations/${artifactId}`, { method: "DELETE" });
    if (!res.ok) {
      throw new ApiError("delete conversation failed", res.status, await this.parseJson(res));
    }
  }

  async listDirectConversations(rootSpaceId: SpaceId): Promise<ListDirectConversationsResponse> {
    const res = await this.request(`/api/root-spaces/${rootSpaceId}/direct-conversations`);
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("list direct conversations failed", res.status, body);
    return ListDirectConversationsResponse.parse(body);
  }

  async getUnreadSummary(rootSpaceId: SpaceId): Promise<GetUnreadSummaryResponse> {
    const res = await this.request(`/api/root-spaces/${rootSpaceId}/unread-summary`);
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("get unread summary failed", res.status, body);
    return GetUnreadSummaryResponse.parse(body);
  }

  async getConversationUnread(
    conversationId: ArtifactId,
  ): Promise<{ summary: UnreadConversationSummary }> {
    const res = await this.request(`/api/conversations/${conversationId}/unread`);
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("get conversation unread failed", res.status, body);
    const parsed = body as { summary?: unknown };
    return { summary: UnreadConversationSummary.parse(parsed.summary) };
  }

  async markConversationRead(
    conversationId: ArtifactId,
    input: { messageId?: MessageId } = {},
  ): Promise<MarkConversationReadResponse> {
    const res = await this.request(`/api/conversations/${conversationId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("mark conversation read failed", res.status, body);
    return MarkConversationReadResponse.parse(body);
  }

  async createOrOpenDirectConversation(
    input: CreateDirectConversationInput,
  ): Promise<CreateDirectConversationResponse> {
    const res = await this.request("/api/direct-conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("create direct conversation failed", res.status, body);
    return CreateDirectConversationResponse.parse(body);
  }

  async listMessages(
    conversationId: ArtifactId,
    input: {
      cursor?: string;
      size?: number;
      direction?: "next" | "prev";
      around?: MessageId;
    } = {},
  ): Promise<ListMessagesResponse> {
    const query = ListMessagesQuery.parse({
      conversationId,
      ...input,
    });
    const params = new URLSearchParams();
    if (query.cursor) params.set("cursor", query.cursor);
    if (query.around) params.set("around", query.around);
    if (query.size !== undefined) params.set("size", String(query.size));
    if (query.direction) params.set("direction", query.direction);

    const res = await this.request(
      `/api/conversations/${conversationId}/messages?${params.toString()}`,
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("list messages failed", res.status, body);
    return ListMessagesResponse.parse(body);
  }

  async listThreadMessages(
    conversationId: ArtifactId,
    threadId: MessageId,
    input: {
      cursor?: string;
      size?: number;
      direction?: "next" | "prev";
    } = {},
  ): Promise<ListMessagesResponse> {
    const query = ListThreadMessagesQuery.parse({
      conversationId,
      threadId,
      ...input,
    });
    const params = new URLSearchParams();
    if (query.cursor) params.set("cursor", query.cursor);
    if (query.size !== undefined) params.set("size", String(query.size));
    if (query.direction) params.set("direction", query.direction);

    const res = await this.request(
      `/api/conversations/${conversationId}/messages/${threadId}/thread?${params.toString()}`,
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("list thread messages failed", res.status, body);
    return ListMessagesResponse.parse(body);
  }

  async startConversationUpload(
    conversationId: ArtifactId,
    input: StartConversationUploadInput,
  ): Promise<StartConversationUploadResponse> {
    const payload = StartConversationUploadInput.parse(input);
    const res = await this.request(`/api/conversations/${conversationId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("start conversation upload failed", res.status, body);
    return StartConversationUploadResponse.parse(body);
  }

  async listDraftAttachments(
    conversationId: ArtifactId,
    input: { threadId?: MessageId | null } = {},
  ): Promise<{ attachments: AttachmentDto[] }> {
    const params = new URLSearchParams();
    if (input.threadId) params.set("threadId", input.threadId);
    const query = params.toString();
    const res = await this.request(
      `/api/conversations/${conversationId}/attachments${query ? `?${query}` : ""}`,
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("list draft attachments failed", res.status, body);
    const parsed = body as { attachments?: unknown[] };
    const rows = Array.isArray(parsed.attachments) ? parsed.attachments : [];
    return {
      attachments: rows.map((row) => AttachmentDto.parse(row)),
    };
  }

  async uploadConversationPart(
    conversationId: ArtifactId,
    uploadId: string,
    part: number,
    data: Uint8Array,
  ): Promise<void> {
    const res = await this.request(
      `/api/conversations/${conversationId}/attachments/${uploadId}?part=${part}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: data as BodyInit,
      },
    );
    if (!res.ok) {
      throw new ApiError("upload conversation part failed", res.status, await this.parseJson(res));
    }
  }

  async completeConversationUpload(
    conversationId: ArtifactId,
    uploadId: string,
  ): Promise<CompleteConversationUploadResponse> {
    const res = await this.request(
      `/api/conversations/${conversationId}/attachments/${uploadId}/complete`,
      { method: "POST" },
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("complete conversation upload failed", res.status, body);
    return CompleteConversationUploadResponse.parse(body);
  }

  async abortConversationUpload(conversationId: ArtifactId, uploadId: string): Promise<void> {
    const res = await this.request(
      `/api/conversations/${conversationId}/attachments/${uploadId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      throw new ApiError("abort conversation upload failed", res.status, await this.parseJson(res));
    }
  }

  async getMessageDraft(
    conversationId: ArtifactId,
    input: { threadId?: MessageId | null } = {},
  ): Promise<{ draft: MessageDraftDto | null }> {
    const params = new URLSearchParams();
    if (input.threadId) params.set("threadId", input.threadId);
    const query = params.toString();
    const res = await this.request(
      `/api/conversations/${conversationId}/draft${query ? `?${query}` : ""}`,
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("get message draft failed", res.status, body);
    const parsed = body as { draft?: unknown };
    return {
      draft: parsed.draft ? MessageDraftDto.parse(parsed.draft) : null,
    };
  }

  async upsertMessageDraft(
    conversationId: ArtifactId,
    input: UpsertMessageDraftInput,
  ): Promise<{ draft: MessageDraftDto; created: boolean }> {
    const payload = UpsertMessageDraftInput.parse(input);
    const res = await this.request(`/api/conversations/${conversationId}/draft`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await this.parseJson(res);
    if (res.status === 409) {
      const conflict = body as { draft?: MessageDraftDto | null };
      throw new ApiMessageDraftConflictError(conflict);
    }
    if (!res.ok) throw new ApiError("upsert message draft failed", res.status, body);
    const parsed = body as { draft: unknown };
    return { draft: MessageDraftDto.parse(parsed.draft), created: res.status === 201 };
  }

  async deleteMessageDraft(
    conversationId: ArtifactId,
    input: { threadId?: MessageId | null; version?: number } = {},
  ): Promise<void> {
    const params = new URLSearchParams();
    if (input.threadId) params.set("threadId", input.threadId);
    if (input.version !== undefined) params.set("version", String(input.version));
    const query = params.toString();
    const res = await this.request(
      `/api/conversations/${conversationId}/draft${query ? `?${query}` : ""}`,
      { method: "DELETE" },
    );
    const body = await this.parseJson(res);
    if (res.status === 409) {
      const conflict = body as { draft?: MessageDraftDto | null };
      throw new ApiMessageDraftConflictError(conflict);
    }
    if (!res.ok) {
      throw new ApiError("delete message draft failed", res.status, body);
    }
  }

  async postMessage(
    conversationId: ArtifactId,
    input: {
      body?: unknown;
      clientId: ClientId;
      quotesId?: MessageId | null;
      threadId?: MessageId | null;
      attachmentIds?: AttachmentId[];
    },
  ): Promise<PostMessageResponse> {
    const payload = PostMessageInput.parse({
      conversationId,
      ...input,
    });
    const res = await this.request(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("post message failed", res.status, body);
    return PostMessageResponse.parse(body);
  }

  async editMessage(
    conversationId: ArtifactId,
    messageId: MessageId,
    input: { body: unknown },
  ): Promise<PostMessageResponse> {
    const payload = EditMessageInput.parse(input);
    const res = await this.request(
      `/api/conversations/${conversationId}/messages/${messageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("edit message failed", res.status, body);
    return PostMessageResponse.parse(body);
  }

  async deleteMessage(
    conversationId: ArtifactId,
    messageId: MessageId,
  ): Promise<PostMessageResponse> {
    const res = await this.request(
      `/api/conversations/${conversationId}/messages/${messageId}`,
      { method: "DELETE" },
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("delete message failed", res.status, body);
    return PostMessageResponse.parse(body);
  }

  async toggleReaction(
    conversationId: ArtifactId,
    messageId: MessageId,
    input: ToggleReactionInput,
  ): Promise<ToggleReactionResponse> {
    const payload = ToggleReactionInput.parse(input);
    const res = await this.request(
      `/api/conversations/${conversationId}/messages/${messageId}/reactions`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    );
    const body = await this.parseJson(res);
    if (!res.ok) throw new ApiError("toggle reaction failed", res.status, body);
    return ToggleReactionResponse.parse(body);
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
