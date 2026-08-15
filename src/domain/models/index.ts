/**
 * Domain Models for Rummy Timer
 * Fully decoupled from React & DOM.
 */

export type GameStatus = 'setup' | 'playing' | 'paused' | 'round_finished' | 'finished';

export type PlayerRoundStatus = 'active' | 'current_turn' | 'out_by_error' | 'round_winner';

export type ScoreSource = 'round' | 'timeout' | 'game_error' | 'manual';

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon?: string;
  isInitialPlayer?: boolean;
}

export interface GameSettings {
  turnTimeLimitSeconds: number; // e.g. 120
  timeoutPenalty: number;       // e.g. 20
  gameErrorPenalty: number;     // e.g. 150
  warningSeconds: number;       // e.g. 15
  soundEnabled: boolean;
  autoAdvanceOnTimeout: boolean; // false = continua cronometrando tiempo excedido hasta movimiento manual
}

export interface RoundObjective {
  number: number;
  name: string;
  description: string;
  setsNeeded?: number; // e.g. 2 ternas
  runsNeeded?: number; // e.g. 1 escalera
}

export interface Turn {
  id: string;
  roundNumber: number;
  playerId: string;
  startedAt: string;          // ISO string timestamp
  endedAt: string | null;     // ISO string timestamp
  pausedAt: string | null;    // ISO string timestamp
  accumulatedMs: number;
  timeLimitMs: number;
  status: 'running' | 'paused' | 'finished' | 'timeout';
  penaltyApplied: boolean;
}

export interface ScoreEntry {
  id: string;
  playerId: string;
  roundNumber: number;
  points: number;
  source: ScoreSource;
  reason: string;
  createdAt: string;          // ISO string timestamp
}

export interface GameEvent {
  id: string;
  timestamp: string;          // ISO string timestamp
  type: 'GAME_START' | 'ROUND_START' | 'TURN_START' | 'TURN_END' | 'TIMEOUT' | 'GAME_ERROR' | 'ROUND_END' | 'GAME_END' | 'SCORES_UPDATED';
  description: string;
  playerId?: string;
  roundNumber?: number;
  metadata?: Record<string, unknown>;
}

export interface PlayerRoundState {
  playerId: string;
  status: PlayerRoundStatus;
  roundPoints: number;
  cardPointsSubmitted: boolean;
}

export interface Round {
  number: number;
  objective: RoundObjective;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt: string | null;
  endedAt: string | null;
  winnerPlayerId: string | null;
  playerStates: Record<string, PlayerRoundState>;
  turns: Turn[];
}

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  settings: GameSettings;
  players: Player[];
  rounds: Round[];
  currentRoundIndex: number;
  currentTurn: Turn | null;
  scores: ScoreEntry[];
  events: GameEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface GameSummary {
  id: string;
  name: string;
  status: GameStatus;
  playerNames: string[];
  winnerName?: string;
  currentRoundNumber: number;
  totalRounds: number;
  createdAt: string;
  updatedAt: string;
}
