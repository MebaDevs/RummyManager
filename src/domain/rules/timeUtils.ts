import { Game } from '../models';

/**
 * Calculates total accumulated turn time in milliseconds for a specific player across all rounds in a game.
 * If the player is currently in an active running turn, includes the elapsed time of the current turn segment.
 */
export function getPlayerTotalTimeMs(game: Game, playerId: string): number {
  let totalMs = 0;
  const nowMs = Date.now();

  // Only the CURRENT active turn (matched by ID) gets the live running segment.
  // All other turns contribute only their finalized accumulatedMs.
  const activeTurnId = game.currentTurn?.id ?? null;

  game.rounds.forEach((round) => {
    round.turns.forEach((turn) => {
      if (turn.playerId !== playerId) return;

      let turnMs = turn.accumulatedMs || 0;

      // Add live segment ONLY for the one turn that is currently active
      if (
        activeTurnId !== null &&
        turn.id === activeTurnId &&
        turn.playerId === playerId &&
        game.status === 'playing' &&
        turn.startedAt
      ) {
        const runSegment = Math.max(0, nowMs - new Date(turn.startedAt).getTime());
        turnMs += runSegment;
      }

      totalMs += turnMs;
    });
  });

  return totalMs;
}

/**
 * Formats milliseconds into a readable MM:SS or HH:MM:SS string.
 * Example: 65000 ms -> "01:05", 3665000 ms -> "1h 01m 05s"
 */
export function formatPlayerTime(ms: number): string {
  if (isNaN(ms) || ms <= 0) return '00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}
