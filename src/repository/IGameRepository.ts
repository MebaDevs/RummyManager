import { Game, GameSummary } from '../domain/models';

export interface IGameRepository {
  saveGame(game: Game): Promise<void>;
  getGame(id: string): Promise<Game | null>;
  getActiveGame(): Promise<Game | null>;
  getAllGames(): Promise<GameSummary[]>;
  deleteGame(id: string): Promise<void>;
  clearActiveGame(): Promise<void>;
}
