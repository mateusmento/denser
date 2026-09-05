import type { ClaimDueJobs } from "@denser/contracts";
import { claimDueJobs as repositoryClaimDueJobs } from "../domains/scheduling/repository.js";

export const claimDueJobs: ClaimDueJobs = repositoryClaimDueJobs;