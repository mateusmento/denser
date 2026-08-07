import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import makeFetchCookie from "fetch-cookie";
import getPort from "get-port";
import { CookieJar } from "tough-cookie";
import { createApiClient, type ApiClient } from "@denser/api-client";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const apiPkg = path.join(repoRoot, "packages/api");

const SEED_PASSWORD = "password";
const AUTH_SECRET = "e2e-auth-secret-not-for-production";

export type E2eHarness = {
  baseUrl: string;
  createClient: () => ApiClient;
  createAuthedClient: (username?: string) => Promise<ApiClient>;
  stop: () => Promise<void>;
};

async function runApiScript(script: string, env: NodeJS.ProcessEnv): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", ["exec", "tsx", `src/db/${script}.ts`], {
      cwd: apiPkg,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed (${code}): ${stderr}`));
    });
  });
}

async function waitForHealth(baseUrl: string, fetchImpl: typeof fetch): Promise<void> {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetchImpl(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`API did not become healthy at ${baseUrl}`);
}

export async function startHarness(): Promise<E2eHarness> {
  const postgres: StartedPostgreSqlContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("denser")
    .withUsername("denser")
    .withPassword("denser")
    .start();

  const databaseUrl = postgres.getConnectionUri();
  const port = await getPort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    AUTH_SECRET,
    AUTH_URL: `${baseUrl}/api/auth`,
    APP_ORIGIN: baseUrl,
    API_PORT: String(port),
    SEED_PASSWORD,
    SEED_MODE: "minimal",
  };

  await runApiScript("migrate", env);
  await runApiScript("seed", env);

  const apiProcess: ChildProcess = spawn("pnpm", ["exec", "tsx", "src/index.ts"], {
    cwd: apiPkg,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let apiStderr = "";
  apiProcess.stderr?.on("data", (chunk: Buffer) => {
    apiStderr += chunk.toString();
  });

  const stopped = new Promise<void>((resolve, reject) => {
    apiProcess.on("exit", (code, signal) => {
      if (code && code !== 0) {
        reject(new Error(`API exited early (${code}/${signal}): ${apiStderr}`));
      } else {
        resolve();
      }
    });
  });

  try {
    await waitForHealth(baseUrl, fetch);
  } catch (error) {
    apiProcess.kill("SIGTERM");
    throw new Error(`${String(error)}\nAPI stderr:\n${apiStderr}`);
  }

  const createClient = (): ApiClient => {
    const jar = new CookieJar();
    const fetchWithCookies = makeFetchCookie(fetch, jar);
    return createApiClient({
      baseUrl,
      fetch: fetchWithCookies as unknown as typeof fetch,
      getCookieHeader: async () => {
        const fromRoot = await jar.getCookieString(baseUrl);
        if (fromRoot) return fromRoot;
        return jar.getCookieString(`${baseUrl}/api/auth`);
      },
    });
  };

  const createAuthedClient = async (username = "alice"): Promise<ApiClient> => {
    const client = createClient();
    await client.signIn({ username, password: SEED_PASSWORD });
    return client;
  };

  return {
    baseUrl,
    createClient,
    createAuthedClient,
    stop: async () => {
      if (apiProcess.exitCode === null) {
        apiProcess.kill("SIGTERM");
        await Promise.race([
          stopped.catch(() => undefined),
          new Promise((r) => setTimeout(r, 5_000)),
        ]);
      }
      await postgres.stop();
    },
  };
}
