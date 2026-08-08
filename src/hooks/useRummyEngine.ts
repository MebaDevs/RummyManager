import { useState, useEffect, useRef, useCallback } from 'react';
import { Game, GameSettings, Player, RoundObjective } from '../domain/models';
import { RummyEngine } from '../domain/engine/RummyEngine';

export function useRummyEngine(initialGame?: Game | null) {
  const engineRef = useRef<RummyEngine>(new RummyEngine(initialGame || undefined));
  const [gameState, setGameState] = useState<Game>(() => engineRef.current.getGame());

  useEffect(() => {
    if (initialGame && initialGame.id !== gameState.id) {
      engineRef.current = new RummyEngine(initialGame);
      setGameState(engineRef.current.getGame());
    }
  }, [initialGame?.id]);

  useEffect(() => {
    const unsubscribe = engineRef.current.subscribe((updatedGame) => {
      setGameState(updatedGame);
    });
    return () => unsubscribe();
  }, []);

  const initializeGame = useCallback((players: Player[], settings?: GameSettings, customRounds?: RoundObjective[]) => {
    return engineRef.current.initializeGame(players, settings, customRounds);
  }, []);

  const startGame = useCallback(() => {
    return engineRef.current.startGame();
  }, []);

  const finishTurn = useCallback(() => {
    return engineRef.current.finishTurn();
  }, []);

  const timeoutTurn = useCallback(() => {
    return engineRef.current.timeoutTurn();
  }, []);

  const registerGameError = useCallback((targetPlayerId?: string) => {
    return engineRef.current.registerGameError(targetPlayerId);
  }, []);

  const togglePause = useCallback(() => {
    return engineRef.current.togglePause();
  }, []);

  const finishRound = useCallback((winnerPlayerId: string, handPointsMap: Record<string, number>) => {
    return engineRef.current.finishRound(winnerPlayerId, handPointsMap);
  }, []);

  const startNextRound = useCallback(() => {
    return engineRef.current.startNextRound();
  }, []);

  const getCumulativeScores = useCallback(() => {
    return engineRef.current.getCumulativeScores();
  }, []);

  return {
    game: gameState,
    engine: engineRef.current,
    initializeGame,
    startGame,
    finishTurn,
    timeoutTurn,
    registerGameError,
    togglePause,
    finishRound,
    startNextRound,
    getCumulativeScores,
  };
}
