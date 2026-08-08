import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, GameSettings, Player, RoundObjective } from '../domain/models';
import { DEFAULT_GAME_SETTINGS } from '../domain/rules/defaultRounds';
import { LocalGameRepository } from '../repository/LocalGameRepository';
import { IGameRepository } from '../repository/IGameRepository';
import { RummyEngine } from '../domain/engine/RummyEngine';

export type PageView = 'home' | 'new_game' | 'active_game' | 'history' | 'settings';

interface GameContextType {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  activeGame: Game | null;
  setActiveGame: (game: Game | null) => void;
  globalSettings: GameSettings;
  updateGlobalSettings: (settings: GameSettings) => void;
  repository: IGameRepository;
  engine: RummyEngine;
  loadActiveGame: () => Promise<void>;
  createNewGame: (players: Player[], settings: GameSettings, customRounds?: RoundObjective[]) => Promise<Game>;
  updateGameState: (updatedGame: Game) => Promise<void>;
  quitCurrentGame: () => Promise<void>;
}

const repository = new LocalGameRepository();
const engine = new RummyEngine();

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  useEffect(() => {
    loadActiveGame();
  }, []);

  const loadActiveGame = async () => {
    const existing = await repository.getActiveGame();
    if (existing) {
      setActiveGame(existing);
    }
  };

  const updateGlobalSettings = (newSettings: GameSettings) => {
    setGlobalSettings(newSettings);
    localStorage.setItem('rummy_global_settings', JSON.stringify(newSettings));
  };

  const updateGameState = async (updatedGame: Game) => {
    setActiveGame(updatedGame);
    await repository.saveGame(updatedGame);
  };

  const createNewGame = async (
    players: Player[],
    settings: GameSettings,
    customRounds?: RoundObjective[]
  ): Promise<Game> => {
    const freshEngine = new RummyEngine();
    freshEngine.initializeGame(players, settings, customRounds);
    const startedGame = freshEngine.startGame();

    await repository.saveGame(startedGame);
    setActiveGame(startedGame);
    setCurrentPage('active_game');
    return startedGame;
  };

  const quitCurrentGame = async () => {
    if (activeGame) {
      const updatedGame: Game = {
        ...activeGame,
        status: 'finished',
        updatedAt: new Date().toISOString(),
      };
      await repository.saveGame(updatedGame);
    }
    await repository.clearActiveGame();
    setActiveGame(null);
    setCurrentPage('home');
  };

  return (
    <GameContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        activeGame,
        setActiveGame,
        globalSettings,
        updateGlobalSettings,
        repository,
        engine,
        loadActiveGame,
        createNewGame,
        updateGameState,
        quitCurrentGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
