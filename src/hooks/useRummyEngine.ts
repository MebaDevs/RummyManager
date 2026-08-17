import { useState, useEffect, useRef, useCallback } from 'react';
import { Game, GameSettings, Player, RoundObjective } from '../domain/models';
import { RummyEngine } from '../domain/engine/RummyEngine';

export function useRummyEngine(initialGame?: Game | null) {
  const engineRef = useRef<RummyEngine>(new RummyEngine(initialGame || undefined));
  const [gameState, setGameState] = useState<Game>(() => engineRef.current.getGame());

  useEffect(() => {
    if (initialGame) {
      engineRef.current = new RummyEngine(initialGame);
      setGameState(engineRef.current.getGame());
    }
  }, [initialGame]);

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

  const reorderPlayers = useCallback((newOrderedIds: string[]) => {
    return engineRef.current.reorderPlayers(newOrderedIds);
  }, []);

  const getCumulativeScores = useCallback(() => {
    return engineRef.current.getCumulativeScores();
  }, []);

  const removeScoreEntry = useCallback((scoreId: string) => {
    return engineRef.current.removeScoreEntry(scoreId);
  }, []);

  const clearTimeoutPenalties = useCallback((playerId: string, roundNumber?: number) => {
    return engineRef.current.clearTimeoutPenalties(playerId, roundNumber);
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
    reorderPlayers,
    removeScoreEntry,
    clearTimeoutPenalties,
    getCumulativeScores,
  };
}
