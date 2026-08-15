import {
  Game,
  GameSettings,
  Player,
  PlayerRoundState,
  Round,
  RoundObjective,
  ScoreEntry,
  Turn,
  GameEvent,
} from '../models';
import { DEFAULT_GAME_SETTINGS, DEFAULT_RUMMY_ROUNDS } from '../rules/defaultRounds';

export type EngineListener = (game: Game) => void;

export class RummyEngine {
  private game: Game;
  private listeners: Set<EngineListener> = new Set();

  constructor(initialGame?: Game) {
    if (initialGame) {
      this.game = initialGame;
    } else {
      this.game = this.createDefaultGame();
    }
  }

  public getGame(): Game {
    return JSON.parse(JSON.stringify(this.game));
  }

  public subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const stateCopy = this.getGame();
    this.listeners.forEach((listener) => listener(stateCopy));
  }

  private createDefaultGame(): Game {
    const now = new Date().toISOString();
    return {
      id: `game_${Date.now()}`,
      name: 'Partida de Rummy',
      status: 'setup',
      settings: DEFAULT_GAME_SETTINGS,
      players: [],
      rounds: [],
      currentRoundIndex: 0,
      currentTurn: null,
      scores: [],
      events: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  // --- ENGINE ACTIONS ---

  /**
   * Initialize a new game with players and settings.
   */
  public initializeGame(
    players: Player[],
    settings: GameSettings = DEFAULT_GAME_SETTINGS,
    customRounds?: RoundObjective[]
  ): Game {
    if (players.length < 2) {
      throw new Error('Se requieren al menos 2 jugadores para inicializar el juego.');
    }

    const roundsList = customRounds || DEFAULT_RUMMY_ROUNDS;
    const now = new Date().toISOString();

    const initialPlayerStates: Record<string, PlayerRoundState> = {};
    players.forEach((p) => {
      initialPlayerStates[p.id] = {
        playerId: p.id,
        status: 'active',
        roundPoints: 0,
        cardPointsSubmitted: false,
      };
    });

    const rounds: Round[] = roundsList.map((obj, idx) => ({
      number: obj.number,
      objective: obj,
      status: idx === 0 ? 'pending' : 'pending',
      startedAt: null,
      endedAt: null,
      winnerPlayerId: null,
      playerStates: { ...initialPlayerStates },
      turns: [],
    }));

    this.game = {
      id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `Partida de Rummy ${new Date().toLocaleDateString('es-ES')}`,
      status: 'setup',
      settings,
      players,
      rounds,
      currentRoundIndex: 0,
      currentTurn: null,
      scores: [],
      events: [
        {
          id: `evt_${Date.now()}`,
          timestamp: now,
          type: 'GAME_START',
          description: `Partida inicializada con ${players.length} jugadores.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.notify();
    return this.getGame();
  }

  /**
   * Start the match (transitions from setup -> playing and starts turn 1 of round 1).
   * Rule: The first player in the players list (players[0]) ALWAYS starts Round 1.
   */
  public startGame(): Game {
    if (this.game.status !== 'setup') {
      throw new Error('La partida ya ha sido iniciada.');
    }

    const now = new Date().toISOString();
    const currentRound = this.game.rounds[0];
    currentRound.status = 'in_progress';
    currentRound.startedAt = now;

    // Rule: The first player in the list (players[0]) starts Round 1
    const initialPlayer = this.game.players[0];

    // Ensure isInitialPlayer flag matches players[0]
    this.game.players.forEach((p, idx) => {
      p.isInitialPlayer = idx === 0;
    });

    // Set player state to current_turn
    currentRound.playerStates[initialPlayer.id].status = 'current_turn';

    // Create turn 1 — starts PAUSED; user must explicitly resume
    const firstTurn: Turn = {
      id: `turn_${Date.now()}_1`,
      roundNumber: 1,
      playerId: initialPlayer.id,
      startedAt: now,
      endedAt: null,
      pausedAt: now,
      accumulatedMs: 0,
      timeLimitMs: this.game.settings.turnTimeLimitSeconds * 1000,
      status: 'paused',
      penaltyApplied: false,
    };

    currentRound.turns.push(firstTurn);
    this.game.currentTurn = firstTurn;
    this.game.status = 'paused';  // Timer does NOT run until user resumes
    this.game.updatedAt = now;

    this.logEvent('ROUND_START', `Inicio de la Ronda 1: ${currentRound.objective.name}`, undefined, 1);
    this.logEvent('TURN_START', `Turno inicial de ${initialPlayer.name}`, initialPlayer.id, 1);

    this.notify();
    return this.getGame();
  }

  /**
   * Advance to the next eligible active player's turn in the current round.
   */
  public finishTurn(): Game {
    if (this.game.status !== 'playing' || !this.game.currentTurn) {
      return this.getGame();
    }

    const now = new Date().toISOString();
    const currentRound = this.game.rounds[this.game.currentRoundIndex];

    // Finalize current turn
    if (this.game.currentTurn.status === 'running' && this.game.currentTurn.startedAt) {
      const nowMs = new Date(now).getTime();
      const startMs = new Date(this.game.currentTurn.startedAt).getTime();
      const runSegment = Math.max(0, nowMs - startMs);
      this.game.currentTurn.accumulatedMs += runSegment;
    }
    this.game.currentTurn.endedAt = now;
    this.game.currentTurn.status = 'finished';

    const prevPlayerId = this.game.currentTurn.playerId;
    if (currentRound.playerStates[prevPlayerId].status === 'current_turn') {
      currentRound.playerStates[prevPlayerId].status = 'active';
    }

    // Determine next eligible player in rotation
    const nextPlayerId = this.getNextEligiblePlayerId(prevPlayerId);
    if (!nextPlayerId) {
      // No active players remaining
      this.notify();
      return this.getGame();
    }

    // Set new player to current_turn
    currentRound.playerStates[nextPlayerId].status = 'current_turn';

    const nextPlayer = this.game.players.find((p) => p.id === nextPlayerId);

    const newTurn: Turn = {
      id: `turn_${Date.now()}_${currentRound.turns.length + 1}`,
      roundNumber: currentRound.number,
      playerId: nextPlayerId,
      startedAt: now,
      endedAt: null,
      pausedAt: null,
      accumulatedMs: 0,
      timeLimitMs: this.game.settings.turnTimeLimitSeconds * 1000,
      status: 'running',
      penaltyApplied: false,
    };

    currentRound.turns.push(newTurn);
    this.game.currentTurn = newTurn;
    this.game.updatedAt = now;

    this.logEvent('TURN_START', `Turno de ${nextPlayer?.name || nextPlayerId}`, nextPlayerId, currentRound.number);

    this.notify();
    return this.getGame();
  }

  /**
   * Handle Turn Timeout (time limit reached).
   * Applies timeout penalty once. If autoAdvanceOnTimeout is true, advances turn.
   * If autoAdvanceOnTimeout is false, keeps turn active for overdue time.
   */
  public timeoutTurn(): Game {
    if (this.game.status !== 'playing' || !this.game.currentTurn) {
      return this.getGame();
    }

    const turn = this.game.currentTurn;
    const now = new Date().toISOString();
    const currentRound = this.game.rounds[this.game.currentRoundIndex];
    const player = this.game.players.find((p) => p.id === turn.playerId);

    // Apply penalty ONCE per turn
    if (!turn.penaltyApplied) {
      turn.penaltyApplied = true;
      turn.status = 'timeout';

      if (this.game.settings.timeoutPenalty > 0) {
        const scoreEntry: ScoreEntry = {
          id: `score_${Date.now()}`,
          playerId: turn.playerId,
          roundNumber: currentRound.number,
          points: this.game.settings.timeoutPenalty,
          source: 'timeout',
          reason: `Penalización por Timeout (+${this.game.settings.timeoutPenalty} pts)`,
          createdAt: now,
        };
        this.game.scores.push(scoreEntry);
        currentRound.playerStates[turn.playerId].roundPoints += this.game.settings.timeoutPenalty;
      }

      this.logEvent(
        'TIMEOUT',
        `Timeout de ${player?.name}. Penalización: +${this.game.settings.timeoutPenalty} pts.`,
        turn.playerId,
        currentRound.number
      );
    }

    // Only advance turn if autoAdvanceOnTimeout is enabled
    if (this.game.settings.autoAdvanceOnTimeout) {
      turn.endedAt = now;
      return this.finishTurn();
    }

    this.game.updatedAt = now;
    this.notify();
    return this.getGame();
  }

  /**
   * Apply "Game Error" penalty (+150 pts) and eliminate player from current round (`out_by_error`).
   * Rule: If +150 is applied, any previous timeout penalties in the current round for this player are cancelled.
   */
  public registerGameError(targetPlayerId?: string): Game {
    if (this.game.status !== 'playing' || !this.game.currentTurn) {
      return this.getGame();
    }

    const playerId = targetPlayerId || this.game.currentTurn.playerId;
    const now = new Date().toISOString();
    const currentRound = this.game.rounds[this.game.currentRoundIndex];
    const player = this.game.players.find((p) => p.id === playerId);
    const roundState = currentRound.playerStates[playerId];

    // Rule: Cancel/remove any previous timeout penalty entries for this player in the current round
    const timeoutEntriesInRound = this.game.scores.filter(
      (sc) => sc.playerId === playerId && sc.roundNumber === currentRound.number && sc.source === 'timeout'
    );

    if (timeoutEntriesInRound.length > 0) {
      const cancelledTimeoutPoints = timeoutEntriesInRound.reduce((acc, sc) => acc + sc.points, 0);
      roundState.roundPoints = Math.max(0, roundState.roundPoints - cancelledTimeoutPoints);

      // Remove timeout entries from game.scores
      this.game.scores = this.game.scores.filter(
        (sc) => !(sc.playerId === playerId && sc.roundNumber === currentRound.number && sc.source === 'timeout')
      );

      this.logEvent(
        'GAME_ERROR',
        `Se anulan ${cancelledTimeoutPoints} pts de timeout previos en la Ronda ${currentRound.number} para ${player?.name} al aplicar Error de Juego.`,
        playerId,
        currentRound.number
      );
    }

    // Apply +150 points penalty
    const penaltyPoints = this.game.settings.gameErrorPenalty;
    const scoreEntry: ScoreEntry = {
      id: `score_err_${Date.now()}`,
      playerId,
      roundNumber: currentRound.number,
      points: penaltyPoints,
      source: 'game_error',
      reason: `Sanción por Error de Juego (+${penaltyPoints} pts)`,
      createdAt: now,
    };
    this.game.scores.push(scoreEntry);

    // Mark player as out_by_error for the rest of this round
    roundState.status = 'out_by_error';
    roundState.roundPoints += penaltyPoints;

    this.logEvent(
      'GAME_ERROR',
      `⚠️ Error de Juego de ${player?.name}. Penalización: +${penaltyPoints} pts. Fuera de la Ronda ${currentRound.number}.`,
      playerId,
      currentRound.number
    );

    // If target was current turn player, advance turn
    if (this.game.currentTurn.playerId === playerId) {
      return this.finishTurn();
    }

    this.game.updatedAt = now;
    this.notify();
    return this.getGame();
  }

  /**
   * Pause or Resume the current turn timer.
   * Freezes accumulatedMs at the exact millisecond when pausing.
   */
  public togglePause(): Game {
    if (this.game.status !== 'playing' && this.game.status !== 'paused') {
      return this.getGame();
    }

    const now = new Date().toISOString();
    const nowMs = new Date(now).getTime();

    if (this.game.status === 'playing') {
      this.game.status = 'paused';
      if (this.game.currentTurn) {
        if (this.game.currentTurn.startedAt) {
          const runSegment = Math.max(0, nowMs - new Date(this.game.currentTurn.startedAt).getTime());
          this.game.currentTurn.accumulatedMs += runSegment;
        }
        this.game.currentTurn.status = 'paused';
        this.game.currentTurn.pausedAt = now;
      }
    } else {
      this.game.status = 'playing';
      if (this.game.currentTurn) {
        this.game.currentTurn.status = 'running';
        this.game.currentTurn.startedAt = now;
        this.game.currentTurn.pausedAt = null;
      }
    }

    this.game.updatedAt = now;
    this.notify();
    return this.getGame();
  }

  /**
   * Declare a winner for the current round and enter remaining hand points for non-eliminated players.
   */
  public finishRound(winnerPlayerId: string, handPointsMap: Record<string, number>): Game {
    if (this.game.status !== 'playing' && this.game.status !== 'paused') {
      return this.getGame();
    }

    const now = new Date().toISOString();
    const currentRound = this.game.rounds[this.game.currentRoundIndex];
    currentRound.status = 'completed';
    currentRound.endedAt = now;
    currentRound.winnerPlayerId = winnerPlayerId;
    currentRound.playerStates[winnerPlayerId].status = 'round_winner';

    // Winner gets 0 hand points
    const winnerScore: ScoreEntry = {
      id: `score_win_${Date.now()}`,
      playerId: winnerPlayerId,
      roundNumber: currentRound.number,
      points: 0,
      source: 'round',
      reason: `Ganador de Ronda ${currentRound.number} (0 pts)`,
      createdAt: now,
    };
    this.game.scores.push(winnerScore);

    // Other non-eliminated players get their submitted card points
    Object.entries(handPointsMap).forEach(([pid, pts]) => {
      if (pid !== winnerPlayerId) {
        const state = currentRound.playerStates[pid];
        if (state && state.status !== 'out_by_error') {
          const scoreEntry: ScoreEntry = {
            id: `score_hand_${Date.now()}_${pid}`,
            playerId: pid,
            roundNumber: currentRound.number,
            points: pts,
            source: 'round',
            reason: `Puntos de cartas retenidas (${pts} pts)`,
            createdAt: now,
          };
          this.game.scores.push(scoreEntry);
          state.roundPoints += pts;
          state.cardPointsSubmitted = true;
        }
      }
    });

    const winner = this.game.players.find((p) => p.id === winnerPlayerId);
    this.logEvent(
      'ROUND_END',
      `🏆 Ronda ${currentRound.number} finalizada. Ganador: ${winner?.name}.`,
      winnerPlayerId,
      currentRound.number
    );

    // Check if this was the last round
    if (this.game.currentRoundIndex >= this.game.rounds.length - 1) {
      this.game.status = 'finished';
      this.logEvent('GAME_END', `🏁 Juego completado. Gana el jugador con menor puntaje total.`, undefined);
    } else {
      this.game.status = 'round_finished';
    }

    this.game.currentTurn = null;
    this.game.updatedAt = now;
    this.notify();
    return this.getGame();
  }

  /**
   * Remove a specific timeout score entry by ID and deduct its points from the player's round score.
   */
  public removeScoreEntry(scoreId: string): Game {
    const scoreIndex = this.game.scores.findIndex((sc) => sc.id === scoreId);
    if (scoreIndex === -1) return this.getGame();

    const score = this.game.scores[scoreIndex];
    if (score.source !== 'timeout') return this.getGame();

    const now = new Date().toISOString();
    const player = this.game.players.find((p) => p.id === score.playerId);
    const round = this.game.rounds.find((r) => r.number === score.roundNumber);

    if (round && round.playerStates[score.playerId]) {
      const state = round.playerStates[score.playerId];
      state.roundPoints = Math.max(0, state.roundPoints - score.points);
    }

    this.game.scores.splice(scoreIndex, 1);

    this.logEvent(
      'SCORES_UPDATED',
      `🗑️ Se eliminó la penalización por timeout (+${score.points} pts) de ${player?.name || score.playerId} en Ronda ${score.roundNumber}.`,
      score.playerId,
      score.roundNumber
    );

    this.game.updatedAt = now;
    this.notify();
    return this.getGame();
  }

  /**
   * Remove all timeout penalty score entries for a player in a given round (or current round).
   */
  public clearTimeoutPenalties(playerId: string, roundNumber?: number): Game {
    const targetRoundNum = roundNumber ?? this.game.rounds[this.game.currentRoundIndex]?.number;
    if (!targetRoundNum) return this.getGame();

    const now = new Date().toISOString();
    const player = this.game.players.find((p) => p.id === playerId);
    const round = this.game.rounds.find((r) => r.number === targetRoundNum);

    const timeoutEntries = this.game.scores.filter(
      (sc) => sc.playerId === playerId && sc.roundNumber === targetRoundNum && sc.source === 'timeout'
    );

    if (timeoutEntries.length === 0) return this.getGame();

    const totalRemoved = timeoutEntries.reduce((sum, sc) => sum + sc.points, 0);

    if (round && round.playerStates[playerId]) {
      round.playerStates[playerId].roundPoints = Math.max(0, round.playerStates[playerId].roundPoints - totalRemoved);
    }

    this.game.scores = this.game.scores.filter(
      (sc) => !(sc.playerId === playerId && sc.roundNumber === targetRoundNum && sc.source === 'timeout')
    );

    this.logEvent(
      'SCORES_UPDATED',
      `🗑️ Se eliminaron ${totalRemoved} pts de timeout para ${player?.name || playerId} en Ronda ${targetRoundNum}.`,
      playerId,
      targetRoundNum
    );

    this.game.updatedAt = now;
    this.notify();
    return this.getGame();
  }

  /**
   * Start the next round. Reactivates all players who were `out_by_error` in previous round.
   */
  public startNextRound(): Game {
    if (this.game.status !== 'round_finished') {
      return this.getGame();
    }

    const nextIndex = this.game.currentRoundIndex + 1;
    if (nextIndex >= this.game.rounds.length) {
      this.game.status = 'finished';
      this.notify();
      return this.getGame();
    }

    const now = new Date().toISOString();
    this.game.currentRoundIndex = nextIndex;
    const nextRound = this.game.rounds[nextIndex];
    nextRound.status = 'in_progress';
    nextRound.startedAt = now;

    // Reactivate ALL players for the new round
    this.game.players.forEach((p) => {
      nextRound.playerStates[p.id] = {
        playerId: p.id,
        status: 'active',
        roundPoints: 0,
        cardPointsSubmitted: false,
      };
    });

    // Sequential starting player rotation: Round 1 -> Player 0, Round 2 -> Player 1, Round 3 -> Player 2, etc.
    const startingPlayerIndex = nextIndex % this.game.players.length;
    const startingPlayerId = this.game.players[startingPlayerIndex].id;
    nextRound.playerStates[startingPlayerId].status = 'current_turn';

    // First turn of new round — starts PAUSED; user must explicitly resume
    const firstTurn: Turn = {
      id: `turn_${Date.now()}_r${nextRound.number}_1`,
      roundNumber: nextRound.number,
      playerId: startingPlayerId,
      startedAt: now,
      endedAt: null,
      pausedAt: now,
      accumulatedMs: 0,
      timeLimitMs: this.game.settings.turnTimeLimitSeconds * 1000,
      status: 'paused',
      penaltyApplied: false,
    };

    nextRound.turns.push(firstTurn);
    this.game.currentTurn = firstTurn;
    this.game.status = 'paused';  // Timer does NOT run until user resumes
    this.game.updatedAt = now;

    const startingPlayer = this.game.players.find((p) => p.id === startingPlayerId);
    this.logEvent('ROUND_START', `Inicio de la Ronda ${nextRound.number}: ${nextRound.objective.name}`, undefined, nextRound.number);
    this.logEvent('TURN_START', `Turno inicial de ${startingPlayer?.name}`, startingPlayerId, nextRound.number);

    this.notify();
    return this.getGame();
  }

  /**
   * Reorder players during active game without breaking current turn or state.
   */
  public reorderPlayers(newOrderedIds: string[]): Game {
    const playerMap = new Map(this.game.players.map((p) => [p.id, p]));
    const reordered: Player[] = [];

    newOrderedIds.forEach((id) => {
      const p = playerMap.get(id);
      if (p) reordered.push(p);
    });

    // Add any remaining players not in newOrderedIds
    this.game.players.forEach((p) => {
      if (!newOrderedIds.includes(p.id)) {
        reordered.push(p);
      }
    });

    this.game.players = reordered;
    this.game.updatedAt = new Date().toISOString();

    this.logEvent('GAME_START', 'Reordenamiento de asientos de jugadores aplicado.');
    this.notify();
    return this.getGame();
  }

  /**
   * Calculate cumulative scores per player across all rounds.
   * Lower points = higher position.
   * Rule: Timeout penalty entries in a round are omitted if player has a game_error in that same round.
   */
  public getCumulativeScores(): { player: Player; totalPoints: number; rank: number }[] {
    const totals: Record<string, number> = {};
    this.game.players.forEach((p) => {
      totals[p.id] = 0;
    });

    // Identify rounds where player has a game_error
    const gameErrorRoundsPerPlayer = new Set<string>();
    this.game.scores.forEach((sc) => {
      if (sc.source === 'game_error') {
        gameErrorRoundsPerPlayer.add(`${sc.playerId}_r${sc.roundNumber}`);
      }
    });

    this.game.scores.forEach((sc) => {
      if (totals[sc.playerId] !== undefined) {
        // Skip timeout if game_error exists in same round
        if (sc.source === 'timeout' && gameErrorRoundsPerPlayer.has(`${sc.playerId}_r${sc.roundNumber}`)) {
          return;
        }
        totals[sc.playerId] += sc.points;
      }
    });

    const result = this.game.players.map((player) => ({
      player,
      totalPoints: totals[player.id] || 0,
      rank: 1,
    }));

    // Sort ascending by totalPoints (lowest score wins!)
    result.sort((a, b) => a.totalPoints - b.totalPoints);
    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    return result;
  }

  // --- HELPER METHODS ---

  private getNextEligiblePlayerId(currentId: string): string | null {
    const currentRound = this.game.rounds[this.game.currentRoundIndex];
    const playerList = this.game.players;
    const currentIndex = playerList.findIndex((p) => p.id === currentId);

    for (let i = 1; i <= playerList.length; i++) {
      const nextIdx = (currentIndex + i) % playerList.length;
      const candidateId = playerList[nextIdx].id;
      const state = currentRound.playerStates[candidateId];

      // Eligible if active (not out_by_error and not round_winner)
      if (state && state.status !== 'out_by_error' && state.status !== 'round_winner') {
        return candidateId;
      }
    }

    return null;
  }

  private logEvent(
    type: GameEvent['type'],
    description: string,
    playerId?: string,
    roundNumber?: number
  ): void {
    const event: GameEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      description,
      playerId,
      roundNumber,
    };
    this.game.events.push(event);
  }
}
