import type { UserId } from "@denser/contracts";
import * as artifactRepository from "../artifacts/repository.js";
import { toArtifactSummary } from "../artifacts/mapper.js";
import { listHomeRootSpaces } from "../spaces/service.js";

export async function getHome(userId: UserId) {
  const [spaces, artifacts] = await Promise.all([
    listHomeRootSpaces(userId),
    artifactRepository.listRootArtifactsByOwner(userId).then((rows) => rows.map((row) => toArtifactSummary(row))),
  ]);

  return { spaces, artifacts };
}
