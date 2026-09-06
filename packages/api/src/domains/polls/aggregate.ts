import type { PollDto, PollId, PollOptionId, UserId } from "@denser/contracts";
import type { PollOptionRow, PollRow, PollVoteRow } from "./types.js";

export function buildPollDto(
  poll: PollRow,
  options: PollOptionRow[],
  votes: PollVoteRow[],
  viewerId: UserId,
): PollDto {
  const sortedOptions = [...options].sort((a, b) => a.position - b.position);
  const voteCounts = new Map<PollOptionId, number>();
  let viewerOption: PollOptionId | null = null;
  for (const vote of votes) {
    voteCounts.set(vote.optionId, (voteCounts.get(vote.optionId) ?? 0) + 1);
    if (vote.userId === viewerId) viewerOption = vote.optionId;
  }
  const optionDtos = sortedOptions.map((option) => ({
    id: option.id,
    label: option.label,
    voteCount: voteCounts.get(option.id) ?? 0,
  }));
  const totalVotes = optionDtos.reduce((sum, option) => sum + option.voteCount, 0);
  return {
    id: poll.id,
    question: poll.question,
    options: optionDtos,
    votedOptionId: viewerOption,
    totalVotes,
  };
}

export function buildPollMap(
  polls: PollRow[],
  options: PollOptionRow[],
  votes: PollVoteRow[],
  viewerId: UserId,
): Map<PollId, PollDto> {
  const optionsByPoll = new Map<PollId, PollOptionRow[]>();
  for (const option of options) {
    const bucket = optionsByPoll.get(option.pollId);
    if (bucket) bucket.push(option);
    else optionsByPoll.set(option.pollId, [option]);
  }
  const votesByPoll = new Map<PollId, PollVoteRow[]>();
  for (const vote of votes) {
    const bucket = votesByPoll.get(vote.pollId);
    if (bucket) bucket.push(vote);
    else votesByPoll.set(vote.pollId, [vote]);
  }
  const map = new Map<PollId, PollDto>();
  for (const poll of polls) {
    map.set(
      poll.id,
      buildPollDto(poll, optionsByPoll.get(poll.id) ?? [], votesByPoll.get(poll.id) ?? [], viewerId),
    );
  }
  return map;
}
