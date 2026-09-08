type ActivePlayer = {
  id: string;
  pause: () => void;
};

let activePlayer: ActivePlayer | null = null;

export function claimAudioPlayback(playerId: string, pause: () => void) {
  if (activePlayer && activePlayer.id !== playerId) {
    activePlayer.pause();
  }
  activePlayer = { id: playerId, pause };
}

export function releaseAudioPlayback(playerId: string) {
  if (activePlayer?.id === playerId) {
    activePlayer = null;
  }
}

export function getActiveAudioPlayerId(): string | null {
  return activePlayer?.id ?? null;
}
