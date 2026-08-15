import { Game, GameSummary } from '../domain/models';
import { IGameRepository } from './IGameRepository';

const STORAGE_KEY_ACTIVE_GAME_ID = 'rummy_active_game_id';
const STORAGE_KEY_GAME_PREFIX = 'rummy_game_';
const STORAGE_KEY_GAMES_INDEX = 'rummy_games_index';

export class LocalGameRepository implements IGameRepository {
  async saveGame(game: Game): Promise<void> {
    try {
      const updatedGame = { ...game, updatedAt: new Date().toISOString() };
      localStorage.setItem(
        `${STORAGE_KEY_GAME_PREFIX}${game.id}`,
        JSON.stringify(updatedGame)
      );

      if (game.status === 'playing' || game.status === 'paused' || game.status === 'round_finished') {
        localStorage.setItem(STORAGE_KEY_ACTIVE_GAME_ID, game.id);
      } else if (game.status === 'finished') {
        const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_GAME_ID);
        if (activeId === game.id) {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_GAME_ID);
        }
      }

      await this.updateGamesIndex(updatedGame);
    } catch (error) {
      console.error('LocalGameRepository: Failed to save game', error);
    }
  }

  async getGame(id: string): Promise<Game | null> {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_GAME_PREFIX}${id}`);
      return data ? (JSON.parse(data) as Game) : null;
    } catch (error) {
      console.error(`LocalGameRepository: Failed to get game ${id}`, error);
      return null;
    }
  }

  async getActiveGame(): Promise<Game | null> {
    try {
      const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_GAME_ID);
      if (!activeId) return null;
      return await this.getGame(activeId);
    } catch (error) {
      console.error('LocalGameRepository: Failed to get active game', error);
      return null;
    }
  }

  async getAllGames(): Promise<GameSummary[]> {
    try {
      const indexData = localStorage.getItem(STORAGE_KEY_GAMES_INDEX);
      if (!indexData) return [];
      return JSON.parse(indexData) as GameSummary[];
    } catch (error) {
      console.error('LocalGameRepository: Failed to get all games', error);
      return [];
    }
  }

  async deleteGame(id: string): Promise<void> {
    try {
      localStorage.removeItem(`${STORAGE_KEY_GAME_PREFIX}${id}`);
      const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_GAME_ID);
      if (activeId === id) {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_GAME_ID);
      }

      const summaries = await this.getAllGames();
      const filtered = summaries.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY_GAMES_INDEX, JSON.stringify(filtered));
    } catch (error) {
      console.error(`LocalGameRepository: Failed to delete game ${id}`, error);
    }
  }

  async clearActiveGame(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_GAME_ID);
  }

  private async updateGamesIndex(game: Game): Promise<void> {
    const summaries = await this.getAllGames();
    const existingIndex = summaries.findIndex((s) => s.id === game.id);

    // For finished games: true winner = player with LOWEST total accumulated points
    // For in-progress games: show winner of the last completed round
    let winnerPlayer = undefined;
    if (game.status === 'finished') {
      // Replicate getCumulativeScores logic: sum points, skip timeout if game_error in same round
      const totals: Record<string, number> = {};
      game.players.forEach((p) => { totals[p.id] = 0; });
      const gameErrorRoundsPerPlayer = new Set<string>();
      game.scores.forEach((sc) => {
        if (sc.source === 'game_error') gameErrorRoundsPerPlayer.add(`${sc.playerId}_r${sc.roundNumber}`);
      });
      game.scores.forEach((sc) => {
        if (totals[sc.playerId] !== undefined) {
          if (sc.source === 'timeout' && gameErrorRoundsPerPlayer.has(`${sc.playerId}_r${sc.roundNumber}`)) return;
          totals[sc.playerId] += sc.points;
        }
      });
      const winnerEntry = game.players.reduce(
        (best, p) => (totals[p.id] < totals[best.id] ? p : best),
        game.players[0]
      );
      winnerPlayer = winnerEntry;
    } else {
      // In-progress: show last completed round winner
      const lastCompleted = [...game.rounds].reverse().find((r) => r.status === 'completed');
      winnerPlayer = game.players.find((p) => p.id === lastCompleted?.winnerPlayerId);
    }

    const summary: GameSummary = {
      id: game.id,
      name: game.name,
      status: game.status,
      playerNames: game.players.map((p) => p.name),
      winnerName: winnerPlayer?.name,
      currentRoundNumber: game.currentRoundIndex + 1,
      totalRounds: game.rounds.length,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    if (existingIndex >= 0) {
      summaries[existingIndex] = summary;
    } else {
      summaries.unshift(summary);
    }

    localStorage.setItem(STORAGE_KEY_GAMES_INDEX, JSON.stringify(summaries));
  }
}
