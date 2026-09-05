import type {
  ArtifactId,
  DocumentTypeId,
  SpaceId,
  SpaceRole,
  TipTapDoc,
  UserId,
  WorkflowStageId,
} from "@denser/contracts";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { account, session, user, verification } from "./schema/auth.js";
import { artifact } from "./schema/artifact.js";
import { conversation } from "./schema/conversation.js";
import { conversationPeer } from "./schema/conversation-peer.js";
import { dmSidebarPreference } from "./schema/dm-sidebar-preference.js";
import { document } from "./schema/document.js";
import { space, spaceMembership } from "./schema/space.js";
import { documentType, workflow, workflowStage } from "./schema/workflow.js";
import { provisionProjectPlanning } from "../domains/workflows/repository.js";
import {
  conversationMessageSeedModules,
  seedConversationMessages,
} from "./seed/conversations/index.js";
import {
  SEED_ARTIFACT_A11Y_STANDARDS,
  SEED_ARTIFACT_ADR_001,
  SEED_ARTIFACT_API_GUIDELINES,
  SEED_ARTIFACT_CHAN_ENGINEERING,
  SEED_ARTIFACT_CHAN_GENERAL,
  SEED_ARTIFACT_CHAN_PRODUCT,
  SEED_ARTIFACT_CHAN_RANDOM,
  SEED_ARTIFACT_DESIGN_TOKENS,
  SEED_ARTIFACT_DM_CAROL,
  SEED_ARTIFACT_DM_DAVID,
  SEED_ARTIFACT_DM_GROUP,
  SEED_ARTIFACT_INCIDENT_RUNBOOK,
  SEED_ARTIFACT_ONBOARDING_NOTES,
  SEED_ARTIFACT_PERSONAL_NOTES,
  SEED_ARTIFACT_RFC_REALTIME,
  SEED_ARTIFACT_STRATEGY_OKRS,
  SEED_ARTIFACT_USER_RESEARCH,
  SEED_ARTIFACT_WEEKLY_PRIORITIES,
  SEED_SPACE_ACME,
  SEED_SPACE_ARCH_RFCS,
  SEED_SPACE_CORE_PLATFORM,
  SEED_SPACE_DESIGN_SYSTEM,
  SEED_SPACE_ENGINEERING,
  SEED_SPACE_GROWTH_SCRUM,
  SEED_SPACE_GROWTH_SPRINT_ACTIVE,
  SEED_SPACE_GROWTH_SPRINT_PAST,
  SEED_SPACE_GROWTH_SPRINT_UPCOMING,
  SEED_SPACE_LEADERSHIP,
  SEED_SPACE_MOBILE_PROJECT,
  SEED_SPACE_RESEARCH,
  SEED_SPACE_SPRINT_ACTIVE,
  SEED_SPACE_SPRINT_PAST,
  SEED_SPACE_SPRINT_UPCOMING,
  SEED_USER_ALICE,
  SEED_USER_CAROL,
  SEED_USER_DAVID,
  SEED_USER_EMMA,
  SEED_USER_FRANK,
} from "./seed-ids.js";

config({
  path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../.env"),
  quiet: true,
});

type Hero = { id: string; username: string; displayName: string };

const password = process.env.SEED_PASSWORD ?? "password";
const mode = process.env.SEED_MODE === "full" ? "full" : "minimal";
const reset = process.env.SEED_RESET === "1";
const heroesPath = fileURLToPath(new URL("./seed-heroes.json", import.meta.url));
const heroes = JSON.parse(readFileSync(heroesPath, "utf8")) as Hero[];

faker.seed(42);

const passwordHash = await hashPassword(password);

if (reset) {
  await db.delete(document);
  await db.delete(dmSidebarPreference);
  await db.delete(conversationPeer);
  await db.delete(conversation);
  await db.delete(artifact);
  await db.delete(documentType);
  await db.delete(workflowStage);
  await db.delete(workflow);
  await db.delete(spaceMembership);
  await db.delete(space);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
  console.log("SEED_RESET=1: cleared auth and domain tables.");
}

// ---------------------------------------------------------------------------
// UUID Generator for deterministic bulk seeding
// ---------------------------------------------------------------------------

function makeId(ns: number, idx: number): ArtifactId {
  const hexNs = ns.toString(16).padStart(4, "0");
  const hexIdx = idx.toString(16).padStart(8, "0");
  return `00000000-0000-4000-8000-${hexNs}${hexIdx}` as ArtifactId;
}

// ---------------------------------------------------------------------------
// TipTap document construction helpers
// ---------------------------------------------------------------------------

type ContentNode = Record<string, unknown>;

function doc(...content: ContentNode[]): TipTapDoc {
  return {
    type: "doc",
    content,
  };
}

function h(level: 1 | 2 | 3 | 4, text: string): ContentNode {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function p(...parts: (string | ContentNode)[]): ContentNode {
  return {
    type: "paragraph",
    content: parts.map((part) => (typeof part === "string" ? { type: "text", text: part } : part)),
  };
}

function t(text: string, marks?: { type: string; attrs?: Record<string, unknown> }[]): ContentNode {
  return marks ? { type: "text", marks, text } : { type: "text", text };
}

function bold(text: string): ContentNode {
  return t(text, [{ type: "bold" }]);
}

function italic(text: string): ContentNode {
  return t(text, [{ type: "italic" }]);
}

function strike(text: string): ContentNode {
  return t(text, [{ type: "strike" }]);
}

function code(text: string): ContentNode {
  return t(text, [{ type: "code" }]);
}

function link(text: string, href: string): ContentNode {
  return t(text, [{ type: "link", attrs: { href } }]);
}

function mention(id: string, label: string): ContentNode {
  return { type: "mention", attrs: { id, label } };
}

function bulletList(...items: (string | (string | ContentNode)[])[]): ContentNode {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [typeof item === "string" ? p(item) : p(...item)],
    })),
  };
}

function orderedList(...items: (string | (string | ContentNode)[])[]): ContentNode {
  return {
    type: "orderedList",
    content: items.map((item) => ({
      type: "listItem",
      content: [typeof item === "string" ? p(item) : p(...item)],
    })),
  };
}

function taskList(
  ...items: { checked: boolean; text: string | (string | ContentNode)[] }[]
): ContentNode {
  return {
    type: "taskList",
    content: items.map((item) => ({
      type: "taskItem",
      attrs: { checked: item.checked },
      content: [typeof item.text === "string" ? p(item.text) : p(...item.text)],
    })),
  };
}

function blockquote(...parts: (string | ContentNode)[]): ContentNode {
  return {
    type: "blockquote",
    content: [p(...parts)],
  };
}

function codeBlock(language: string, codeText: string): ContentNode {
  return {
    type: "codeBlock",
    attrs: { language },
    content: [{ type: "text", text: codeText }],
  };
}

function hr(): ContentNode {
  return { type: "horizontalRule" };
}

function img(src: string, alt: string): ContentNode {
  return {
    type: "image",
    attrs: { src, alt },
  };
}

// ---------------------------------------------------------------------------
// Rich Document Templates
// ---------------------------------------------------------------------------

const featureTourDoc: TipTapDoc = doc(
  h(1, "Onboarding notes"),
  p(
    "Welcome to ",
    bold("Denser"),
    "! Select any sentence for the format menu. Type ",
    code("/"),
    " for blocks, or ",
    code("@"),
    " to mention teammates like ",
    mention(SEED_USER_ALICE, "Alice Chen"),
    " or ",
    mention(SEED_USER_CAROL, "Carol Vance"),
    ".",
  ),
  h(2, "Inline marks"),
  p(
    bold("Bold"),
    ", ",
    italic("italic"),
    ", ",
    strike("strike"),
    ", ",
    code("inline code"),
    ", and a ",
    link("hyperlink", "https://github.com"),
    ".",
  ),
  h(3, "Lists and tasks"),
  bulletList(
    "Workspaces organize teams, projects, and knowledge.",
    [bold("Scrum projects"), " handle sprints, estimation, and backlog planning."],
    [bold("Kanban boards"), " manage continuous flow across stage columns."],
  ),
  orderedList(
    "Explore the left sidebar to navigate root spaces and channels.",
    "Open the Backlog or Board tab in any project.",
    "Drag and drop cards across stages or between sprint buckets.",
  ),
  taskList(
    { checked: true, text: ["Review project workflows and stage transitions"] },
    { checked: true, text: ["Verify multi-tenant space isolation and permissions"] },
    { checked: false, text: ["Test optimistic concurrency resolution (409 conflict handling)"] },
    { checked: false, text: ["Try direct messaging and group conversation threads"] },
  ),
  h(2, "Blockquotes & Notes"),
  blockquote(
    bold("Pro-tip:"),
    " Spaces can be public to root members or strictly private. Switch views anytime using the top tab bar.",
  ),
  hr(),
  h(2, "Code & Architecture"),
  codeBlock(
    "ts",
    `import { createApiClient } from "@denser/api-client";\n\nconst client = createApiClient({ baseUrl: "http://localhost:3000" });\nconst { space } = await client.getSpace("00000000-0000-4000-8000-000000000010");\nconsole.log(\`Active space: \${space.title}\`);\n`,
  ),
  img(
    "https://placehold.co/640x240/1e293b/94a3b8?text=Denser+Workspace+Architecture",
    "Architecture overview diagram",
  ),
  p(
    "Questions or suggestions? Ping ",
    mention(SEED_USER_DAVID, "David Kim"),
    " in the ",
    bold("#engineering"),
    " channel.",
  ),
);

const adr001Doc: TipTapDoc = doc(
  h(1, "ADR 001: Unified Document Model & Optimistic Concurrency"),
  blockquote("Status: ", bold("Accepted"), " | Date: 2026-08-15 | Deciders: Architecture Guild"),
  h(2, "Context"),
  p(
    "Denser needs a flexible document and artifact schema that supports rich text specs, issue tracking items, sprint backlog cards, and conversation threads without schema fragmentation.",
  ),
  h(2, "Decision"),
  p(
    "We adopt a unified artifact-document relational model in PostgreSQL paired with a standard TipTap AST stored in jsonb. Every artifact carries an incrementing integer ",
    code("version"),
    " field for optimistic concurrency checks.",
  ),
  h(3, "Key Properties"),
  bulletList(
    [bold("Relational Metadata:"), " Fast indexed querying for spaces, roots, stages, and ranks."],
    [
      bold("JSONB Content:"),
      " Schema-free, extensible TipTap document tree supporting all rich marks.",
    ],
    [
      bold("Optimistic Locking:"),
      " Concurrent writes submit expected version; 409 returned on collision with server state.",
    ],
  ),
  h(2, "Consequences"),
  taskList(
    {
      checked: true,
      text: "Zero migrations required when adding new custom rich-text block types.",
    },
    {
      checked: true,
      text: "High-performance Kanban / Backlog ranking using sparse integer strides.",
    },
    {
      checked: false,
      text: "Realtime presence and OT/CRDT convergence layer to be layered on top.",
    },
  ),
);

const rfcRealtimeDoc: TipTapDoc = doc(
  h(1, "RFC 042: Realtime Collab Engine & Presence Protocol"),
  blockquote("Status: ", italic("In Review"), " | Author: ", mention(SEED_USER_DAVID, "David Kim")),
  h(2, "Summary"),
  p(
    "Specification for WebSocket-based live cursor broadcast, user presence awareness, and optimistic sync invalidation across workspace views.",
  ),
  h(2, "Message Schema"),
  codeBlock(
    "json",
    `{\n  "type": "presence:update",\n  "spaceId": "00000000-0000-4000-8000-000000000010",\n  "userId": "00000000-0000-4000-8000-000000000001",\n  "cursor": { "x": 342, "y": 810 },\n  "activeTab": "board"\n}\n`,
  ),
  h(2, "Rollout Checklist"),
  taskList(
    { checked: true, text: "Attach WebSocket server to HTTP listener" },
    { checked: true, text: "Heartbeat and reconnect backoff in browser client" },
    { checked: false, text: "Room-scoped presence channels per active space" },
    { checked: false, text: "Broadcast conflict notification on 409 responses" },
  ),
);

const incidentRunbookDoc: TipTapDoc = doc(
  h(1, "Incident Response Runbook & Severity Matrix"),
  p("Standard operating procedure for production incident escalation and resolution."),
  h(2, "Severity Classification"),
  bulletList(
    [
      bold("SEV-0 (Critical Outage):"),
      " Total system unavailability or data loss risk. Page on-call immediately.",
    ],
    [
      bold("SEV-1 (Major Degradation):"),
      " Core feature broken (e.g., auth or drag-and-drop). Triage within 15 min.",
    ],
    [bold("SEV-2 (Minor Degradation):"), " Non-blocking issue with immediate workaround."],
    [bold("SEV-3 (Cosmetic / Low):"), " Minor glitch or visual imperfection."],
  ),
  h(2, "Triage Protocol"),
  orderedList(
    "Acknowledge the page in PagerDuty within 5 minutes.",
    "Create an incident channel #incident-YYYYMMDD in Acme.",
    "Assign Incident Commander (IC) and Communications Lead.",
    "Broadcast initial status page update within 15 minutes.",
  ),
);

const apiGuidelinesDoc: TipTapDoc = doc(
  h(1, "API Style Guide & Error Conventions"),
  p("Conventions for REST endpoints, Zod contract validation, and response shapes across Denser."),
  h(2, "Error Envelope Standard"),
  codeBlock(
    "json",
    `{\n  "error": "conflict",\n  "message": "Document version is stale",\n  "document": { "id": "...", "version": 4 }\n}\n`,
  ),
  h(2, "HTTP Status Rules"),
  bulletList(
    [code("200 OK"), " for successful reads and mutations."],
    [code("400 Bad Request"), " on Zod validation failure or illegal stage transition."],
    [code("403 Forbidden"), " when user lacks space or role permissions."],
    [code("404 Not Found"), " when entity is absent or hidden by tenancy."],
    [code("409 Conflict"), " on optimistic version mismatch during patch operations."],
  ),
);

const strategyOkrsDoc: TipTapDoc = doc(
  h(1, "Q3 Product Strategy & OKRs"),
  blockquote("Confidential — Executive Leadership & Product Strategy"),
  h(2, "Objective 1: Make Denser the fastest team workspace on the market"),
  taskList(
    {
      checked: true,
      text: ["KR 1: Sub-50ms optimistic UI transitions for board and backlog drag actions"],
    },
    { checked: false, text: ["KR 2: Full offline draft persistence with auto-recovery"] },
    { checked: false, text: ["KR 3: 99.99% uptime with automated multi-region failover"] },
  ),
  h(2, "Objective 2: Best-in-class multi-user collaboration"),
  taskList(
    {
      checked: true,
      text: ["KR 1: Unified direct messaging and group discussions within workspaces"],
    },
    { checked: false, text: ["KR 2: Live cursor and multi-caret presence in rich documents"] },
  ),
);

const designTokensDoc: TipTapDoc = doc(
  h(1, "Design Tokens & Foundations"),
  p("Core design tokens utilized across the Denser design system and application shell."),
  h(2, "Typography Scales"),
  bulletList(
    [bold("Display:"), " 32px / 2rem — font-semibold tracking-tight"],
    [bold("Heading 1:"), " 24px / 1.5rem — font-semibold tracking-tight"],
    [bold("Heading 2:"), " 18px / 1.125rem — font-medium"],
    [bold("Body:"), " 14px / 0.875rem — text-sm leading-relaxed text-foreground"],
    [bold("Muted / Caption:"), " 12px / 0.75rem — text-xs text-muted-foreground"],
  ),
  h(2, "Color Foundations"),
  bulletList(
    [bold("Primary:"), " hsl(var(--primary)) — Brand accent and primary interactive targets"],
    [bold("Muted:"), " hsl(var(--muted)) — Card backgrounds, secondary fills, and borders"],
    [bold("Destructive:"), " hsl(var(--destructive)) — Irreversible actions, error alerts"],
  ),
);

const a11yStandardsDoc: TipTapDoc = doc(
  h(1, "Accessibility (a11y) Standards & Checklist"),
  p(
    "Guidelines to guarantee WCAG 2.1 Level AA compliance across all components and view surfaces.",
  ),
  taskList(
    {
      checked: true,
      text: "All interactive controls have visible focus rings with adequate contrast",
    },
    {
      checked: true,
      text: "Keyboard navigation supported for board drag-and-drop and space tab bar",
    },
    { checked: true, text: "Screen reader aria-labels present on all icon-only buttons and menus" },
    { checked: false, text: "High-contrast mode theme variant audit and verification" },
  ),
);

const userResearchDoc: TipTapDoc = doc(
  h(1, "Customer Research Synthesis: Q3 Feedback"),
  p("Takeaways from 12 in-depth interviews with Engineering Managers and Lead Designers."),
  h(2, "Key Findings"),
  bulletList(
    [
      bold("Fluid Planning:"),
      " Teams love having Scrum sprints and continuous Kanban boards in one place.",
    ],
    [
      bold("Document Context:"),
      " Embedding specs directly into sprint backlogs eliminated Jira/Notion context switching.",
    ],
    [
      bold("Speed Matters:"),
      " Instant keyboard-driven navigation is cited as the primary reason developers adopt Denser.",
    ],
  ),
);

const personalNotesDoc: TipTapDoc = doc(
  h(1, "Personal notes"),
  p("Alice's personal scratchpad and daily working memory."),
  h(2, "Weekly Focus"),
  taskList(
    { checked: true, text: ["Finalize Sprint 2 drag-and-drop reindexing PR review"] },
    { checked: true, text: ["Sync with Carol on Design System component token hierarchy"] },
    { checked: false, text: ["Write technical spec for offline-first synchronization"] },
    { checked: false, text: ["Prepare demo deck for Friday all-hands showcase"] },
  ),
  h(2, "Quick Links & Bookmarks"),
  bulletList(
    [link("Acme Workspace", "/spaces/00000000-0000-4000-8000-000000000010")],
    [link("Core Platform Scrum Board", "/spaces/00000000-0000-4000-8000-000000000012?view=board")],
    [
      link(
        "Growth & Analytics Scrum Board",
        "/spaces/00000000-0000-4000-8000-00000000001b?view=board",
      ),
    ],
  ),
);

const weeklyPrioritiesDoc: TipTapDoc = doc(
  h(1, "Weekly Priorities & Goals"),
  p("Sprint commitment and deliverables tracking for the current cycle."),
  taskList(
    { checked: true, text: ["Deliver Realtime Presence indicator prototype"] },
    { checked: true, text: ["Fix optimistic 409 conflict retry edge case"] },
    { checked: false, text: ["Conduct architectural review for WebSocket clustering"] },
    { checked: false, text: ["Draft hiring requirements for Senior Frontend Engineer"] },
  ),
);

// ---------------------------------------------------------------------------
// Database helper routines
// ---------------------------------------------------------------------------

async function upsertCredentialUser(input: {
  id: UserId;
  username: string;
  displayName: string;
}): Promise<UserId> {
  const [row] = await db
    .insert(user)
    .values({
      id: input.id,
      name: input.displayName,
      email: `${input.username}@local.dev`,
      emailVerified: true,
      username: input.username,
      displayUsername: input.username,
    })
    .onConflictDoUpdate({
      target: user.username,
      set: {
        name: input.displayName,
        email: `${input.username}@local.dev`,
        emailVerified: true,
        displayUsername: input.username,
        updatedAt: new Date(),
      },
    })
    .returning({ id: user.id });

  if (!row) {
    throw new Error(`Failed to upsert user ${input.username}`);
  }

  const existingAccount = await db.query.account.findFirst({
    where: eq(account.userId, row.id),
    columns: { id: true },
  });

  if (existingAccount) {
    await db
      .update(account)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(account.userId, row.id));
    return row.id;
  }

  await db.insert(account).values({
    accountId: row.id,
    providerId: "credential",
    userId: row.id,
    password: passwordHash,
  });

  return row.id;
}

async function seedBulkUsers(): Promise<void> {
  const bulk = Array.from({ length: 8 }, () => ({
    username: faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24),
    displayName: faker.person.fullName(),
  }));
  const unique = [...new Map(bulk.map((u) => [u.username, u])).values()].filter(
    (u) => u.username.length >= 3 && !heroes.some((h) => h.username === u.username),
  );

  for (const row of unique) {
    const [upserted] = await db
      .insert(user)
      .values({
        name: row.displayName,
        email: `${row.username}@local.dev`,
        emailVerified: true,
        username: row.username,
        displayUsername: row.username,
      })
      .onConflictDoUpdate({
        target: user.username,
        set: {
          name: row.displayName,
          updatedAt: new Date(),
        },
      })
      .returning({ id: user.id });

    if (!upserted) continue;

    const existingAccount = await db.query.account.findFirst({
      where: eq(account.userId, upserted.id),
      columns: { id: true },
    });

    if (existingAccount) {
      await db
        .update(account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(account.userId, upserted.id));
      continue;
    }

    await db.insert(account).values({
      accountId: upserted.id,
      providerId: "credential",
      userId: upserted.id,
      password: passwordHash,
    });
  }
}

async function upsertSpace(input: {
  id: SpaceId;
  title: string;
  icon?: string | null | undefined;
  visibility?: "public" | "private" | undefined;
  parentSpaceId?: SpaceId | null | undefined;
  rootSpaceId?: SpaceId | null | undefined;
  createdBy: UserId;
  showBacklog?: boolean | undefined;
  showBoard?: boolean | undefined;
  sprintingEnabled?: boolean | undefined;
  sprintRole?: "upcoming" | "active" | "past" | null | undefined;
  sprintDurationWeeks?: (1 | 2 | 4) | undefined;
  nextSprintNumber?: number | undefined;
  sprintGoal?: string | null | undefined;
  sprintStartedAt?: Date | null | undefined;
  sprintCompletedAt?: Date | null | undefined;
  sprintPlannedEndAt?: Date | null | undefined;
  activeSprintId?: SpaceId | null | undefined;
  upcomingSprintId?: SpaceId | null | undefined;
}): Promise<void> {
  await db
    .insert(space)
    .values({
      id: input.id,
      title: input.title,
      icon: input.icon ?? "folder",
      visibility: input.visibility ?? "public",
      parentSpaceId: input.parentSpaceId ?? null,
      rootSpaceId: input.rootSpaceId ?? null,
      createdBy: input.createdBy,
      showBacklog: input.showBacklog ?? false,
      showBoard: input.showBoard ?? false,
      sprintingEnabled: input.sprintingEnabled ?? false,
      sprintRole: input.sprintRole ?? null,
      sprintDurationWeeks: input.sprintDurationWeeks ?? 2,
      nextSprintNumber: input.nextSprintNumber ?? 1,
      sprintGoal: input.sprintGoal ?? null,
      sprintStartedAt: input.sprintStartedAt ?? null,
      sprintCompletedAt: input.sprintCompletedAt ?? null,
      sprintPlannedEndAt: input.sprintPlannedEndAt ?? null,
      activeSprintId: input.activeSprintId ?? null,
      upcomingSprintId: input.upcomingSprintId ?? null,
    })
    .onConflictDoUpdate({
      target: space.id,
      set: {
        title: input.title,
        icon: input.icon ?? "folder",
        visibility: input.visibility ?? "public",
        parentSpaceId: input.parentSpaceId ?? null,
        rootSpaceId: input.rootSpaceId ?? null,
        createdBy: input.createdBy,
        showBacklog: input.showBacklog ?? false,
        showBoard: input.showBoard ?? false,
        sprintingEnabled: input.sprintingEnabled ?? false,
        sprintRole: input.sprintRole ?? null,
        sprintDurationWeeks: input.sprintDurationWeeks ?? 2,
        nextSprintNumber: input.nextSprintNumber ?? 1,
        sprintGoal: input.sprintGoal ?? null,
        sprintStartedAt: input.sprintStartedAt ?? null,
        sprintCompletedAt: input.sprintCompletedAt ?? null,
        sprintPlannedEndAt: input.sprintPlannedEndAt ?? null,
        activeSprintId: input.activeSprintId ?? null,
        upcomingSprintId: input.upcomingSprintId ?? null,
        updatedAt: new Date(),
      },
    });
}

async function upsertMembership(spaceId: SpaceId, userId: UserId, role: SpaceRole): Promise<void> {
  await db
    .insert(spaceMembership)
    .values({ spaceId, userId, role })
    .onConflictDoUpdate({
      target: [spaceMembership.spaceId, spaceMembership.userId],
      set: { role },
    });
}

async function upsertDocumentArtifact(input: {
  id: ArtifactId;
  title: string;
  spaceId?: SpaceId | null | undefined;
  rootSpaceId?: SpaceId | null | undefined;
  createdBy: UserId;
  body: TipTapDoc;
  documentTypeId?: DocumentTypeId | null | undefined;
  stageId?: WorkflowStageId | null | undefined;
  rank?: number | undefined;
}): Promise<void> {
  await db
    .insert(artifact)
    .values({
      id: input.id,
      kind: "document",
      title: input.title,
      spaceId: input.spaceId ?? null,
      rootSpaceId: input.rootSpaceId ?? null,
      createdBy: input.createdBy,
    })
    .onConflictDoUpdate({
      target: artifact.id,
      set: {
        title: input.title,
        spaceId: input.spaceId ?? null,
        rootSpaceId: input.rootSpaceId ?? null,
        createdBy: input.createdBy,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(document)
    .values({
      artifactId: input.id,
      body: input.body,
      documentTypeId: input.documentTypeId ?? null,
      stageId: input.stageId ?? null,
      rank: input.rank ?? 0,
    })
    .onConflictDoUpdate({
      target: document.artifactId,
      set: {
        body: input.body,
        documentTypeId: input.documentTypeId ?? null,
        stageId: input.stageId ?? null,
        rank: input.rank ?? 0,
      },
    });
}

async function upsertChannelArtifact(input: {
  id: ArtifactId;
  title: string;
  spaceId?: SpaceId | null | undefined;
  rootSpaceId?: SpaceId | null | undefined;
  createdBy: UserId;
  intro?: string | null | undefined;
}): Promise<void> {
  await db
    .insert(artifact)
    .values({
      id: input.id,
      kind: "conversation",
      title: input.title,
      spaceId: input.spaceId ?? null,
      rootSpaceId: input.rootSpaceId ?? null,
      createdBy: input.createdBy,
    })
    .onConflictDoUpdate({
      target: artifact.id,
      set: {
        title: input.title,
        spaceId: input.spaceId ?? null,
        rootSpaceId: input.rootSpaceId ?? null,
        createdBy: input.createdBy,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(conversation)
    .values({
      artifactId: input.id,
      conversationKind: "regular",
      intro: input.intro ?? null,
    })
    .onConflictDoUpdate({
      target: conversation.artifactId,
      set: {
        conversationKind: "regular",
        intro: input.intro ?? null,
      },
    });
}

async function upsertDirectConversationArtifact(input: {
  id: ArtifactId;
  title: string;
  rootSpaceId: SpaceId;
  createdBy: UserId;
  memberUserIds: UserId[];
}): Promise<void> {
  const memberSetKey = [...new Set(input.memberUserIds)].sort().join(":");

  await db
    .insert(artifact)
    .values({
      id: input.id,
      kind: "conversation",
      title: input.title,
      spaceId: null,
      rootSpaceId: null,
      createdBy: input.createdBy,
    })
    .onConflictDoUpdate({
      target: artifact.id,
      set: {
        title: input.title,
        spaceId: null,
        rootSpaceId: null,
        createdBy: input.createdBy,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(conversation)
    .values({
      artifactId: input.id,
      conversationKind: "direct",
      rootSpaceId: input.rootSpaceId,
      memberSetKey,
    })
    .onConflictDoUpdate({
      target: conversation.artifactId,
      set: {
        conversationKind: "direct",
        rootSpaceId: input.rootSpaceId,
        memberSetKey,
      },
    });

  for (const userId of input.memberUserIds) {
    await db
      .insert(conversationPeer)
      .values({
        conversationArtifactId: input.id,
        userId,
      })
      .onConflictDoNothing();
  }
}

// ---------------------------------------------------------------------------
// Main Seed Routine
// ---------------------------------------------------------------------------

for (const hero of heroes) {
  await upsertCredentialUser({
    id: hero.id as UserId,
    username: hero.username,
    displayName: hero.displayName,
  });
}

if (mode === "full") {
  await seedBulkUsers();
}

const aliceId = SEED_USER_ALICE;
const carolId = SEED_USER_CAROL;
const davidId = SEED_USER_DAVID;
const emmaId = SEED_USER_EMMA;
const frankId = SEED_USER_FRANK;
const teamUsers = [aliceId, carolId, davidId, emmaId, frankId];

// 1. Root Space: Acme (Private Team Workspace)
await upsertSpace({
  id: SEED_SPACE_ACME,
  title: "Acme",
  icon: "briefcase",
  visibility: "private",
  createdBy: aliceId,
});

await upsertMembership(SEED_SPACE_ACME, aliceId, "owner");
await upsertMembership(SEED_SPACE_ACME, carolId, "admin");
await upsertMembership(SEED_SPACE_ACME, davidId, "member");
await upsertMembership(SEED_SPACE_ACME, emmaId, "member");
await upsertMembership(SEED_SPACE_ACME, frankId, "member");

// 2. Nested Space: Engineering Folder (Public in Acme)
await upsertSpace({
  id: SEED_SPACE_ENGINEERING,
  title: "Engineering",
  icon: "code",
  visibility: "public",
  parentSpaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
});

// Sub-folder: Architecture & RFCs
await upsertSpace({
  id: SEED_SPACE_ARCH_RFCS,
  title: "Architecture & RFCs",
  icon: "book",
  visibility: "public",
  parentSpaceId: SEED_SPACE_ENGINEERING,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
});

// Documents in Architecture & RFCs
await upsertDocumentArtifact({
  id: SEED_ARTIFACT_ADR_001,
  title: "ADR 001: Unified Document Model",
  spaceId: SEED_SPACE_ARCH_RFCS,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  body: adr001Doc,
  rank: 1000,
});

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_RFC_REALTIME,
  title: "RFC 042: Realtime Collab Engine",
  spaceId: SEED_SPACE_ARCH_RFCS,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: davidId,
  body: rfcRealtimeDoc,
  rank: 2000,
});

// Documents in Engineering
await upsertDocumentArtifact({
  id: SEED_ARTIFACT_ONBOARDING_NOTES,
  title: "Onboarding notes",
  spaceId: SEED_SPACE_ENGINEERING,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  body: featureTourDoc,
  rank: 1000,
});

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_INCIDENT_RUNBOOK,
  title: "Incident Response Runbook",
  spaceId: SEED_SPACE_ENGINEERING,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: emmaId,
  body: incidentRunbookDoc,
  rank: 2000,
});

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_API_GUIDELINES,
  title: "API Style Guide & Conventions",
  spaceId: SEED_SPACE_ENGINEERING,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: davidId,
  body: apiGuidelinesDoc,
  rank: 3000,
});

// Channel in Engineering
await upsertChannelArtifact({
  id: SEED_ARTIFACT_CHAN_ENGINEERING,
  title: "engineering",
  spaceId: SEED_SPACE_ENGINEERING,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  intro: "Core engineering discussions, architecture reviews, and build notifications.",
});

// ---------------------------------------------------------------------------
// 3. Scrum Project 1: Core Platform (High-Density Sprints for DnD Scrolling)
// ---------------------------------------------------------------------------

await upsertSpace({
  id: SEED_SPACE_CORE_PLATFORM,
  title: "Core Platform",
  icon: "rocket",
  visibility: "public",
  parentSpaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  showBacklog: true,
  showBoard: true,
  sprintingEnabled: true,
  sprintDurationWeeks: 2,
  nextSprintNumber: 4,
  activeSprintId: null,
  upcomingSprintId: null,
});

await provisionProjectPlanning(SEED_SPACE_CORE_PLATFORM);

const coreWorkflows = await db.query.workflow.findMany({
  where: eq(workflow.spaceId, SEED_SPACE_CORE_PLATFORM),
  with: { stages: true },
});
const coreDocTypes = await db.query.documentType.findMany({
  where: eq(documentType.spaceId, SEED_SPACE_CORE_PLATFORM),
});

const coreIssueWorkflow = coreWorkflows.find((w) => w.name === "Issue tracking");
const coreSpecWorkflow = coreWorkflows.find((w) => w.name === "Spec");

const coreTodoStage = coreIssueWorkflow?.stages.find((s) => s.name === "Todo");
const coreInProgressStage = coreIssueWorkflow?.stages.find((s) => s.name === "In Progress");
const coreInReviewStage = coreIssueWorkflow?.stages.find((s) => s.name === "In Review");
const coreDoneStage = coreIssueWorkflow?.stages.find((s) => s.name === "Done");

const coreSpecDraftStage = coreSpecWorkflow?.stages.find((s) => s.name === "Draft");
const coreSpecInReviewStage = coreSpecWorkflow?.stages.find((s) => s.name === "In Review");
const coreSpecApprovedStage = coreSpecWorkflow?.stages.find((s) => s.name === "Approved");
const coreSpecFinalStage = coreSpecWorkflow?.stages.find((s) => s.name === "Final");

const coreIssueDocType = coreDocTypes.find((t) => t.key === "issue");
const coreSpecDocType = coreDocTypes.find((t) => t.key === "spec");

const now = new Date();
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const elevenDaysFromNow = new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000);

// Past Sprint: Sprint 1
await upsertSpace({
  id: SEED_SPACE_SPRINT_PAST,
  title: "Sprint 1",
  icon: "folder",
  visibility: "public",
  parentSpaceId: SEED_SPACE_CORE_PLATFORM,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  sprintRole: "past",
  sprintStartedAt: twoWeeksAgo,
  sprintCompletedAt: threeDaysAgo,
  sprintGoal: "Foundation MVP: multi-tenant schema and authentication.",
});

const pastSprintIssues = [
  "Setup multi-tenant space isolation and row-level security",
  "Credential and session authentication with Argon2 hashing",
  "Initial database migration pipeline and healthcheck routes",
  "Zod contract schema definitions and branded identifier types",
  "Design system foundational tokens (colors, typography, spacing)",
  "Basic app shell layout with sidebar navigation toggle",
];

for (let i = 0; i < pastSprintIssues.length; i++) {
  const issueTitle = pastSprintIssues[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x10, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_SPRINT_PAST,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[i % teamUsers.length]!,
    documentTypeId: coreIssueDocType?.id,
    stageId: coreDoneStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Closed issue: ${issueTitle}`)),
  });
}

// Active Sprint: Sprint 2 (HIGH DENSITY FOR DnD SCROLLING TESTS)
await upsertSpace({
  id: SEED_SPACE_SPRINT_ACTIVE,
  title: "Sprint 2",
  icon: "folder",
  visibility: "public",
  parentSpaceId: SEED_SPACE_CORE_PLATFORM,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  sprintRole: "active",
  sprintStartedAt: threeDaysAgo,
  sprintPlannedEndAt: elevenDaysFromNow,
  sprintGoal: "Realtime collaboration, DnD scroll acceleration, and board physics.",
});

// Stage 1: Todo (25 items — Heavy Vertical Scroll & Autoscroll Testing)
const activeTodoIssues = [
  "Auto-scroll threshold acceleration when dragging cards near column top/bottom edges",
  "Smooth velocity damping during high-speed drag gestures across columns",
  "Viewport boundary containment for oversized document card previews",
  "Horizontal auto-scroll port detection when card approaches container margins",
  "Trackpad inertial scrolling deceleration during active pointer lock",
  "Maintain exact item scroll offset during real-time remote rank updates",
  "Optimistic transform smoothing for drag placeholder spring animations",
  "Touch sensor gesture disambiguation between vertical list scroll and drag pickup",
  "BoundingClientRect snapshot caching to eliminate layout thrashing during scroll",
  "Mouse wheel passthrough handling while dragging active overlay",
  "Prevent browser body overscroll rubber-banding during stage list drag",
  "High-density list virtualizer for boards with 200+ issues",
  "Touch pinch-to-zoom prevention during sensor drag activation",
  "Coordinate space translation on Retina high-DPI scaling displays",
  "Keyboard arrow key nudging and auto-scrolling for accessible card movement",
  "Multi-level nested scroll container resolution for embedded peek sheets",
  "Column scroll position memory across space tab switching",
  "Split-pane scroll synchronization during comparative board views",
  "Drop zone indicator pulse animation at scroll boundary thresholds",
  "Sticky column header positioning during inner list overflow scroll",
  "Pointer exit boundary recovery when mouse rapidly leaves scroll port",
  "Frame rate monitor: verify 60fps during concurrent drag and auto-scroll",
  "Adaptive scroll trigger edge zone width for variable viewport dimensions",
  "Haptic feedback tick on scroll boundary waypoint crossings",
  "Reorder telemetry: measure drag latency and drop precision metrics",
];

for (let i = 0; i < activeTodoIssues.length; i++) {
  const issueTitle = activeTodoIssues[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x20, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[i % teamUsers.length]!,
    documentTypeId: coreIssueDocType?.id,
    stageId: coreTodoStage?.id,
    rank: (i + 1) * 1000,
    body: doc(
      p(issueTitle),
      taskList(
        { checked: false, text: "Verify auto-scroll velocity curve" },
        { checked: false, text: "Check edge zone trigger bounds" },
        { checked: false, text: "Test cross-browser pointer events" },
      ),
    ),
  });
}

// Stage 2: In Progress (15 items — Moderate Vertical Scroll)
const activeInProgressIssues = [
  "Realtime presence indicators and live cursor broadcast over WebSockets",
  "WebSocket reconnect exponential backoff with jitter and heartbeats",
  "Optimistic conflict recovery UI (409 retry modal with merge comparison)",
  "Space tab bar keyboard shortcut navigation (Alt+1 through Alt+9)",
  "Document mention autocomplete dropdown with keyboard navigation",
  "TipTap markdown shortcut parsing for headings and task lists",
  "Multi-avatar presence stack in space header bar",
  "Realtime cursor label rendering with user display name badges",
  "Conflict diff viewer for simultaneous markdown text edits",
  "Drag overlay rotation and shadow elevation styling",
  "Sparse integer rank reindexing stride algorithm (stride: 1000)",
  "Offline mutation queue with background sync replay",
  "Kanban column card counter badges and empty state illustrations",
  "Breadcrumb navigation sync with browser history stack",
  "Active sprint countdown timer and progress calculation",
];

for (let i = 0; i < activeInProgressIssues.length; i++) {
  const issueTitle = activeInProgressIssues[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x21, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[(i + 1) % teamUsers.length]!,
    documentTypeId: coreIssueDocType?.id,
    stageId: coreInProgressStage?.id,
    rank: (i + 1) * 1000,
    body: doc(
      p(issueTitle),
      codeBlock("ts", `// In progress implementation\nconst active = true;\n`),
    ),
  });
}

// Stage 3: In Review (8 items)
const activeInReviewIssues = [
  "Direct conversation deduplication by sorted memberSetKey",
  "Space visibility transition guards (forbid private -> public promotion)",
  "Kanban board cross-column workflow transition validator",
  "Backlog sprint bucket drop zone targeting and ranking",
  "Document duplication with body cloning and rank stride",
  "Rich text code block syntax highlighting with Shiki / Highlight.js",
  "Space members role assignment dialog with owner count safeguards",
  "Mobile drawer sheet for navigation on narrow viewports",
];

for (let i = 0; i < activeInReviewIssues.length; i++) {
  const issueTitle = activeInReviewIssues[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x22, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[(i + 2) % teamUsers.length]!,
    documentTypeId: coreIssueDocType?.id,
    stageId: coreInReviewStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Under review: ${issueTitle}`)),
  });
}

// Stage 4: Done (10 items)
const activeDoneIssues = [
  "Implement unified document-artifact schema in PostgreSQL",
  "Configure Drizzle ORM relations and cascade delete constraints",
  "Create Better-Auth authentication endpoints and cookie sessions",
  "Implement Home surface loading and workspace aggregation",
  "Build rich text TipTap editor with custom extensions",
  "Add space settings dialog with tabbed general and members panels",
  "Develop drag-and-drop sensor primitives (pointer, keyboard, touch)",
  "Implement Zod response schemas and error envelopes",
  "Add dark mode theme tokens and toggle component",
  "Configure Vitest E2E test harness with Testcontainers PostgreSQL",
];

for (let i = 0; i < activeDoneIssues.length; i++) {
  const issueTitle = activeDoneIssues[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x23, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[(i + 3) % teamUsers.length]!,
    documentTypeId: coreIssueDocType?.id,
    stageId: coreDoneStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Completed feature: ${issueTitle}`)),
  });
}

// Upcoming Sprint: Sprint 3
await upsertSpace({
  id: SEED_SPACE_SPRINT_UPCOMING,
  title: "Sprint 3",
  icon: "folder",
  visibility: "public",
  parentSpaceId: SEED_SPACE_CORE_PLATFORM,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  sprintRole: "upcoming",
  sprintGoal: "Performance optimization, mobile responsiveness, and file uploads.",
});

const upcomingSprintIssues = [
  "Virtualize large document list rendering for instant scrolling",
  "Mobile responsive drawer for space navigation on smartphones",
  "S3 / MinIO direct file upload integration with signed URLs",
  "Image paste and drag-and-drop upload in TipTap document editor",
  "Full-text search indexing across spaces and documents with PostgreSQL tsvector",
  "Command palette (Cmd+K) quick open for spaces, documents, and actions",
  "Custom webhook notifications for stage transitions and sprint completion",
  "CSV and JSON export for sprint analytics and board status",
  "Batch document reordering and bulk delete operations",
  "Audit log event streaming and security activity timeline",
  "Fine-grained RBAC permission matrix for project guests",
  "IndexedDB local persistence journal for zero-latency offline boot",
];

for (let i = 0; i < upcomingSprintIssues.length; i++) {
  const issueTitle = upcomingSprintIssues[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x30, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_SPRINT_UPCOMING,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[i % teamUsers.length]!,
    documentTypeId: coreIssueDocType?.id,
    stageId: coreTodoStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Planned sprint item: ${issueTitle}`)),
  });
}

await db
  .update(space)
  .set({
    activeSprintId: SEED_SPACE_SPRINT_ACTIVE,
    upcomingSprintId: SEED_SPACE_SPRINT_UPCOMING,
  })
  .where(eq(space.id, SEED_SPACE_CORE_PLATFORM));

// Backlog in Core Platform (20+ Items for Backlog DnD Scrolling)
const coreBacklogItems = [
  {
    title: "Full-text search indexing across spaces and documents",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Custom webhook notifications for stage transitions",
    key: "issue",
    stage: coreTodoStage,
  },
  { title: "PRD: Granular Permission Matrices", key: "spec", stage: coreSpecDraftStage },
  { title: "Spec: Offline-first Sync Architecture", key: "spec", stage: coreSpecInReviewStage },
  { title: "Spec: Unified Activity & Audit Stream", key: "spec", stage: coreSpecApprovedStage },
  { title: "Spec: Custom Workflow Stage Transitions", key: "spec", stage: coreSpecFinalStage },
  {
    title: "Automated database backup snapshots and point-in-time recovery",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "OAuth 2.0 provider integration (GitHub, Google, GitLab)",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Two-factor authentication (TOTP) enforcement for organization admins",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Global keyboard shortcut engine with customizable keybindings",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Document version diff viewer with inline additions and deletions",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Custom status emoji and user availability status badges",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Multi-tenant resource quota management and usage metering",
    key: "issue",
    stage: coreTodoStage,
  },
  { title: "Spec: Multi-region Edge Caching Architecture", key: "spec", stage: coreSpecDraftStage },
  {
    title: "Spec: High-availability WebSocket Gateway Cluster",
    key: "spec",
    stage: coreSpecInReviewStage,
  },
  {
    title: "Integration test suite for complex sprint rollover scenarios",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Interactive onboarding wizard for newly invited organization members",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Theme customization engine with custom CSS variable overrides",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Workspace analytics dashboard with burndown charts and velocity graphs",
    key: "issue",
    stage: coreTodoStage,
  },
  {
    title: "Rich text document export to PDF and Markdown format",
    key: "issue",
    stage: coreTodoStage,
  },
];

for (let i = 0; i < coreBacklogItems.length; i++) {
  const item = coreBacklogItems[i]!;
  const isSpec = item.key === "spec";
  await upsertDocumentArtifact({
    id: makeId(0x40, i + 1),
    title: item.title,
    spaceId: SEED_SPACE_CORE_PLATFORM,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[i % teamUsers.length]!,
    documentTypeId: isSpec ? coreSpecDocType?.id : coreIssueDocType?.id,
    stageId: item.stage?.id,
    rank: (i + 1) * 1000,
    body: isSpec
      ? doc(h(1, item.title), p("Architecture and technical specification documentation."))
      : doc(p(`Product backlog issue: ${item.title}`)),
  });
}

// ---------------------------------------------------------------------------
// 4. Scrum Project 2: Growth & Analytics (Second Dedicated Scrum Project)
// ---------------------------------------------------------------------------

await upsertSpace({
  id: SEED_SPACE_GROWTH_SCRUM,
  title: "Growth & Analytics",
  icon: "chart",
  visibility: "public",
  parentSpaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  showBacklog: true,
  showBoard: true,
  sprintingEnabled: true,
  sprintDurationWeeks: 2,
  nextSprintNumber: 13,
  activeSprintId: null,
  upcomingSprintId: null,
});

await provisionProjectPlanning(SEED_SPACE_GROWTH_SCRUM);

const growthWorkflows = await db.query.workflow.findMany({
  where: eq(workflow.spaceId, SEED_SPACE_GROWTH_SCRUM),
  with: { stages: true },
});
const growthDocTypes = await db.query.documentType.findMany({
  where: eq(documentType.spaceId, SEED_SPACE_GROWTH_SCRUM),
});

const growthIssueWorkflow = growthWorkflows.find((w) => w.name === "Issue tracking");
const growthTodoStage = growthIssueWorkflow?.stages.find((s) => s.name === "Todo");
const growthInProgressStage = growthIssueWorkflow?.stages.find((s) => s.name === "In Progress");
const growthInReviewStage = growthIssueWorkflow?.stages.find((s) => s.name === "In Review");
const growthDoneStage = growthIssueWorkflow?.stages.find((s) => s.name === "Done");

const growthIssueDocType = growthDocTypes.find((t) => t.key === "issue");

// Past Sprint: Sprint 10
await upsertSpace({
  id: SEED_SPACE_GROWTH_SPRINT_PAST,
  title: "Sprint 10",
  icon: "folder",
  visibility: "public",
  parentSpaceId: SEED_SPACE_GROWTH_SCRUM,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  sprintRole: "past",
  sprintStartedAt: twoWeeksAgo,
  sprintCompletedAt: threeDaysAgo,
  sprintGoal: "Analytics pipeline setup, event schemas, and tracking SDK.",
});

const growthPastIssues = [
  "Setup telemetry ingest pipeline with ClickHouse / DuckDB",
  "Define canonical tracking event taxonomy and JSON schemas",
  "Build lightweight browser analytics client with batch flushing",
  "Implement user privacy opt-out and cookie consent banner",
  "Segment destination webhook sync for user signup events",
  "Verify GDPR data erasure and export endpoint compliance",
];

for (let i = 0; i < growthPastIssues.length; i++) {
  const issueTitle = growthPastIssues[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x50, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_GROWTH_SPRINT_PAST,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[i % teamUsers.length]!,
    documentTypeId: growthIssueDocType?.id,
    stageId: growthDoneStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Growth Sprint 10 closed issue: ${issueTitle}`)),
  });
}

// Active Sprint: Sprint 11 (High Density for DnD Testing)
await upsertSpace({
  id: SEED_SPACE_GROWTH_SPRINT_ACTIVE,
  title: "Sprint 11",
  icon: "folder",
  visibility: "public",
  parentSpaceId: SEED_SPACE_GROWTH_SCRUM,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  sprintRole: "active",
  sprintStartedAt: threeDaysAgo,
  sprintPlannedEndAt: elevenDaysFromNow,
  sprintGoal: "Funnel conversion, viral referral loops, and dashboard widgets.",
});

// Todo Stage: 20 issues
const growthActiveTodo = [
  "Interactive funnel visualization widget with drop-off percentages",
  "Cohort retention heatmap table with weekly step breakdown",
  "A/B experiment variant allocator with deterministic hashing",
  "Referral invite link generator with viral reward attribution",
  "Realtime active users counter with live Sparkline chart",
  "Automated email digest generation for weekly workspace summary",
  "CSV export for user lifecycle engagement metrics",
  "UTM parameter parser and attribution session persistence",
  "In-app announcement banner modal with targeting criteria",
  "Onboarding checklist completion milestone telemetry",
  "Feature adoption tracking for new drag-and-drop board",
  "Product-qualified lead (PQL) score calculation engine",
  "Subscription upgrade trigger banner on workspace member limits",
  "Net Promoter Score (NPS) in-app survey widget",
  "Custom metric goal tracking with progress indicators",
  "Churn risk prediction model based on login frequency",
  "Daily active team metric cards for workspace owners",
  "Search query analytics to identify content discovery gaps",
  "Integration telemetry: Slack / GitHub webhook success rates",
  "Realtime error rate spike alerts and automated Slack notifications",
];

for (let i = 0; i < growthActiveTodo.length; i++) {
  const issueTitle = growthActiveTodo[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x60, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_GROWTH_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[i % teamUsers.length]!,
    documentTypeId: growthIssueDocType?.id,
    stageId: growthTodoStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(issueTitle)),
  });
}

// In Progress Stage: 10 issues
const growthActiveInProgress = [
  "ClickHouse analytics aggregation queries for dashboard speed",
  "Chart tooltip smoothing and crosshair alignment",
  "User session duration tracking with heartbeat beacons",
  "Workspace activation funnel step 3 drop-off diagnosis",
  "Automated monthly invoice receipt email generation",
  "Self-serve seat expansion billing flow with Stripe checkout",
  "Experiment significance calculator (p-value and confidence intervals)",
  "Dashboard widget customizable grid layout and resizing",
  "Export chart graphics to SVG and PNG formats",
  "Telemetry payload compression using gzip / brotli stream",
];

for (let i = 0; i < growthActiveInProgress.length; i++) {
  const issueTitle = growthActiveInProgress[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x61, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_GROWTH_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[(i + 1) % teamUsers.length]!,
    documentTypeId: growthIssueDocType?.id,
    stageId: growthInProgressStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(issueTitle)),
  });
}

// In Review Stage: 6 issues
const growthActiveInReview = [
  "Mixpanel server-side webhook integration",
  "Intercom messenger user attribute synchronization",
  "Stripe webhook idempotent event handler",
  "Customer feedback tag categorization engine",
  "Annual vs Monthly billing toggle discount calculation",
  "Workspace admin seats usage bar with warning thresholds",
];

for (let i = 0; i < growthActiveInReview.length; i++) {
  const issueTitle = growthActiveInReview[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x62, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_GROWTH_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[(i + 2) % teamUsers.length]!,
    documentTypeId: growthIssueDocType?.id,
    stageId: growthInReviewStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Growth review: ${issueTitle}`)),
  });
}

// Done Stage: 6 issues
const growthActiveDone = [
  "Setup PostgreSQL analytics read replica connection pool",
  "Define user signup and activation event schema contracts",
  "Create growth analytics workspace permission role",
  "Build reusable MetricCard presentation component",
  "Add date range picker (Today, 7D, 30D, 90D, Custom)",
  "Implement telemetry rate limiting and spam filtering",
];

for (let i = 0; i < growthActiveDone.length; i++) {
  const issueTitle = growthActiveDone[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x63, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_GROWTH_SPRINT_ACTIVE,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[(i + 3) % teamUsers.length]!,
    documentTypeId: growthIssueDocType?.id,
    stageId: growthDoneStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Growth completed: ${issueTitle}`)),
  });
}

// Upcoming Sprint: Sprint 12
await upsertSpace({
  id: SEED_SPACE_GROWTH_SPRINT_UPCOMING,
  title: "Sprint 12",
  icon: "folder",
  visibility: "public",
  parentSpaceId: SEED_SPACE_GROWTH_SCRUM,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  sprintRole: "upcoming",
  sprintGoal: "Enterprise SSO, domain capture, and audit logs.",
});

const growthUpcoming = [
  "SAML 2.0 / Okta single sign-on integration",
  "Custom domain verification with DNS TXT record check",
  "Enterprise SCIM user provisioning and de-provisioning",
  "Security audit log compliance export for SOC2",
  "Custom data retention policies per workspace",
  "IP allowlisting for enterprise workspace access",
  "Dedicated support SLA priority routing tag",
  "Multi-organization consolidated billing portal",
];

for (let i = 0; i < growthUpcoming.length; i++) {
  const issueTitle = growthUpcoming[i]!;
  await upsertDocumentArtifact({
    id: makeId(0x70, i + 1),
    title: issueTitle,
    spaceId: SEED_SPACE_GROWTH_SPRINT_UPCOMING,
    rootSpaceId: SEED_SPACE_ACME,
    createdBy: teamUsers[i % teamUsers.length]!,
    documentTypeId: growthIssueDocType?.id,
    stageId: growthTodoStage?.id,
    rank: (i + 1) * 1000,
    body: doc(p(`Growth planned item: ${issueTitle}`)),
  });
}

await db
  .update(space)
  .set({
    activeSprintId: SEED_SPACE_GROWTH_SPRINT_ACTIVE,
    upcomingSprintId: SEED_SPACE_GROWTH_SPRINT_UPCOMING,
  })
  .where(eq(space.id, SEED_SPACE_GROWTH_SCRUM));

// ---------------------------------------------------------------------------
// 5. Kanban Project: Mobile & Web Apps (Continuous Flow)
// ---------------------------------------------------------------------------

await upsertSpace({
  id: SEED_SPACE_MOBILE_PROJECT,
  title: "Mobile & Web Apps",
  icon: "briefcase",
  visibility: "public",
  parentSpaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  showBacklog: true,
  showBoard: true,
  sprintingEnabled: false,
});

await provisionProjectPlanning(SEED_SPACE_MOBILE_PROJECT);

const mobileWorkflows = await db.query.workflow.findMany({
  where: eq(workflow.spaceId, SEED_SPACE_MOBILE_PROJECT),
  with: { stages: true },
});
const mobileDocTypes = await db.query.documentType.findMany({
  where: eq(documentType.spaceId, SEED_SPACE_MOBILE_PROJECT),
});

const mobIssueWorkflow = mobileWorkflows.find((w) => w.name === "Issue tracking");
const mobSpecWorkflow = mobileWorkflows.find((w) => w.name === "Spec");

const mobTodo = mobIssueWorkflow?.stages.find((s) => s.name === "Todo");
const mobInProgress = mobIssueWorkflow?.stages.find((s) => s.name === "In Progress");
const mobInReview = mobIssueWorkflow?.stages.find((s) => s.name === "In Review");
const mobDone = mobIssueWorkflow?.stages.find((s) => s.name === "Done");
const mobSpecApproved = mobSpecWorkflow?.stages.find((s) => s.name === "Approved");

const mobIssueType = mobileDocTypes.find((t) => t.key === "issue");
const mobSpecType = mobileDocTypes.find((t) => t.key === "spec");

await upsertDocumentArtifact({
  id: makeId(0x80, 1),
  title: "Push notification handler for mention alerts",
  spaceId: SEED_SPACE_MOBILE_PROJECT,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: carolId,
  documentTypeId: mobIssueType?.id,
  stageId: mobTodo?.id,
  rank: 1000,
  body: doc(p("Send APNS and FCM notification payloads when @mentions occur.")),
});

await upsertDocumentArtifact({
  id: makeId(0x80, 2),
  title: "iOS swipe gestures for quick action menu",
  spaceId: SEED_SPACE_MOBILE_PROJECT,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: carolId,
  documentTypeId: mobIssueType?.id,
  stageId: mobInProgress?.id,
  rank: 2000,
  body: doc(p("Add left/right swipe gestures on document items for quick pinning and archiving.")),
});

await upsertDocumentArtifact({
  id: makeId(0x80, 3),
  title: "Android adaptive icon & dark mode tokens",
  spaceId: SEED_SPACE_MOBILE_PROJECT,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: carolId,
  documentTypeId: mobIssueType?.id,
  stageId: mobInReview?.id,
  rank: 3000,
  body: doc(
    p("Configure Android 13+ monochrome icon asset and dynamic Material You theme matching."),
  ),
});

await upsertDocumentArtifact({
  id: makeId(0x80, 4),
  title: "Desktop electron wrapper evaluation",
  spaceId: SEED_SPACE_MOBILE_PROJECT,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: davidId,
  documentTypeId: mobIssueType?.id,
  stageId: mobDone?.id,
  rank: 4000,
  body: doc(p("Benchmark Tauri vs Electron memory footprint for desktop distribution.")),
});

await upsertDocumentArtifact({
  id: makeId(0x80, 5),
  title: "Spec: Mobile Peeking & Sheet Navigation",
  spaceId: SEED_SPACE_MOBILE_PROJECT,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: carolId,
  documentTypeId: mobSpecType?.id,
  stageId: mobSpecApproved?.id,
  rank: 5000,
  body: doc(
    h(1, "Spec: Mobile Peeking & Sheet Navigation"),
    p("UX specification for half-sheet document previews on touch screens."),
  ),
});

// ---------------------------------------------------------------------------
// 6. Nested Space: Leadership & Strategy (Private Space in Acme)
// ---------------------------------------------------------------------------

await upsertSpace({
  id: SEED_SPACE_LEADERSHIP,
  title: "Leadership & Strategy",
  icon: "users",
  visibility: "private",
  parentSpaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
});

await upsertMembership(SEED_SPACE_LEADERSHIP, aliceId, "owner");
await upsertMembership(SEED_SPACE_LEADERSHIP, carolId, "admin");
await upsertMembership(SEED_SPACE_LEADERSHIP, frankId, "member");

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_STRATEGY_OKRS,
  title: "Q3 Product Strategy & OKRs",
  spaceId: SEED_SPACE_LEADERSHIP,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  body: strategyOkrsDoc,
  rank: 1000,
});

// ---------------------------------------------------------------------------
// 7. Channels in Acme Root
// ---------------------------------------------------------------------------

await upsertChannelArtifact({
  id: SEED_ARTIFACT_CHAN_GENERAL,
  title: "general",
  spaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  intro: "Company-wide announcements, weekly highlights, and team updates.",
});

await upsertChannelArtifact({
  id: SEED_ARTIFACT_CHAN_PRODUCT,
  title: "product-design",
  spaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: carolId,
  intro: "Design critiques, component reviews, user research insights, and UX patterns.",
});

await upsertChannelArtifact({
  id: SEED_ARTIFACT_CHAN_RANDOM,
  title: "random",
  spaceId: SEED_SPACE_ACME,
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: davidId,
  intro: "Watercooler chatter, music, memes, and casual banter.",
});

// ---------------------------------------------------------------------------
// 8. Direct Messages in Acme Root
// ---------------------------------------------------------------------------

await upsertDirectConversationArtifact({
  id: SEED_ARTIFACT_DM_CAROL,
  title: "Carol Vance",
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  memberUserIds: [aliceId, carolId],
});

await upsertDirectConversationArtifact({
  id: SEED_ARTIFACT_DM_DAVID,
  title: "David Kim",
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  memberUserIds: [aliceId, davidId],
});

await upsertDirectConversationArtifact({
  id: SEED_ARTIFACT_DM_GROUP,
  title: "Carol Vance and David Kim",
  rootSpaceId: SEED_SPACE_ACME,
  createdBy: aliceId,
  memberUserIds: [aliceId, carolId, davidId],
});

// ---------------------------------------------------------------------------
// 9. Public Root Space: Design System & Foundations
// ---------------------------------------------------------------------------

await upsertSpace({
  id: SEED_SPACE_DESIGN_SYSTEM,
  title: "Design System & Foundations",
  icon: "star",
  visibility: "public",
  createdBy: aliceId,
});

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_DESIGN_TOKENS,
  title: "Design Tokens & Foundations",
  spaceId: SEED_SPACE_DESIGN_SYSTEM,
  rootSpaceId: SEED_SPACE_DESIGN_SYSTEM,
  createdBy: carolId,
  body: designTokensDoc,
  rank: 1000,
});

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_A11Y_STANDARDS,
  title: "Accessibility (a11y) Standards",
  spaceId: SEED_SPACE_DESIGN_SYSTEM,
  rootSpaceId: SEED_SPACE_DESIGN_SYSTEM,
  createdBy: carolId,
  body: a11yStandardsDoc,
  rank: 2000,
});

// ---------------------------------------------------------------------------
// 10. Public Root Space: Research & Discovery
// ---------------------------------------------------------------------------

await upsertSpace({
  id: SEED_SPACE_RESEARCH,
  title: "Research & Discovery",
  icon: "book",
  visibility: "public",
  createdBy: aliceId,
});

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_USER_RESEARCH,
  title: "Customer Research Synthesis: Q3 Feedback",
  spaceId: SEED_SPACE_RESEARCH,
  rootSpaceId: SEED_SPACE_RESEARCH,
  createdBy: aliceId,
  body: userResearchDoc,
  rank: 1000,
});

// ---------------------------------------------------------------------------
// 11. Standalone Root Artifacts for Alice on Home
// ---------------------------------------------------------------------------

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_PERSONAL_NOTES,
  title: "Personal notes",
  spaceId: null,
  rootSpaceId: null,
  createdBy: aliceId,
  body: personalNotesDoc,
  rank: 1000,
});

await upsertDocumentArtifact({
  id: SEED_ARTIFACT_WEEKLY_PRIORITIES,
  title: "Weekly Priorities & Goals",
  spaceId: null,
  rootSpaceId: null,
  createdBy: aliceId,
  body: weeklyPrioritiesDoc,
  rank: 2000,
});

const seededMessageCount = await seedConversationMessages(db, conversationMessageSeedModules);

console.log(
  `Seeded rich workspace and features (mode=${mode}, reset=${reset}, password=${password}).`,
);
console.log(`  Users seeded:        ${heroes.map((h) => h.username).join(", ")}`);
console.log(
  `  Root workspaces:     Acme (${SEED_SPACE_ACME}), Design System (${SEED_SPACE_DESIGN_SYSTEM}), Research (${SEED_SPACE_RESEARCH})`,
);
console.log(
  `  Scrum projects:      Core Platform (${SEED_SPACE_CORE_PLATFORM}), Growth & Analytics (${SEED_SPACE_GROWTH_SCRUM})`,
);
console.log(`  Kanban project:      Mobile & Web Apps (${SEED_SPACE_MOBILE_PROJECT})`);
console.log(
  `  Nested folders:      Engineering (${SEED_SPACE_ENGINEERING}), Architecture & RFCs (${SEED_SPACE_ARCH_RFCS}), Leadership (${SEED_SPACE_LEADERSHIP})`,
);
console.log(`  Channels:            #general, #engineering, #product-design, #random`);
console.log(`  Channel messages:    ${seededMessageCount} seeded in #engineering`);
console.log(`  Direct messages:     Alice & Carol, Alice & David, Alice & Carol & David`);
console.log(`  Root artifacts:      Personal notes, Weekly Priorities`);
process.exit(0);
