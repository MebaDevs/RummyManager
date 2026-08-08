import { RummyEngine } from '../RummyEngine';
import { Player } from '../../models';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ TEST FAILED: ${message}`);
  }
}

export function runRummyEngineTests(): void {
  console.log('🧪 Running RummyEngine Unit Tests...');

  const players: Player[] = [
    { id: 'p1', name: 'Ana', avatarColor: '#9b5cff', isInitialPlayer: true },
    { id: 'p2', name: 'Bob', avatarColor: '#35e58a' },
    { id: 'p3', name: 'Carlos', avatarColor: '#ff5365' },
  ];

  const engine = new RummyEngine();
  engine.initializeGame(players);
  let game = engine.getGame();

  assert(game.status === 'setup', 'Game status should be setup');
  assert(game.players.length === 3, 'Should have 3 players');

  // 1. Start Game
  game = engine.startGame();
  assert(game.status === 'playing', 'Game status should be playing');
  assert(game.currentTurn?.playerId === 'p1', 'First turn should be Ana (p1)');

  // 2. Finish Turn -> Bob (p2)
  game = engine.finishTurn();
  assert(game.currentTurn?.playerId === 'p2', 'Second turn should be Bob (p2)');

  // 3. Register Timeout on Bob (+20 pts)
  game = engine.timeoutTurn();
  assert(game.scores.some((sc) => sc.playerId === 'p2' && sc.source === 'timeout'), 'Bob should have a timeout score entry');

  // 3b. Register Game Error on Bob (+150 pts) -> Should CANCEL previous timeout entry (+20 pts)
  game = engine.registerGameError('p2');
  assert(game.rounds[0].playerStates['p2'].status === 'out_by_error', 'Bob should be out_by_error');
  assert(game.rounds[0].playerStates['p2'].roundPoints === 150, 'Bob round points should be 150 (timeout +20 cancelled)');
  assert(!game.scores.some((sc) => sc.playerId === 'p2' && sc.source === 'timeout'), 'Timeout entry for Bob in round 1 should be cancelled and removed');
  assert(game.currentTurn?.playerId === 'p3', 'Turn should automatically advance to Carlos (p3)');

  // 4. Finish Turn -> Ana (p1) [skipping Bob because he is out_by_error]
  game = engine.finishTurn();
  assert(game.currentTurn?.playerId === 'p1', 'Turn should skip Bob and return to Ana (p1)');

  // 5. Finish Round (Ana wins)
  game = engine.finishRound('p1', { p3: 25 });
  assert(game.status === 'round_finished', 'Status should be round_finished');
  assert(game.rounds[0].winnerPlayerId === 'p1', 'Ana should be the winner of round 1');

  // 6. Start Next Round (Round 2)
  game = engine.startNextRound();
  assert(game.status === 'playing', 'Status should be playing in round 2');
  assert(game.currentRoundIndex === 1, 'Current round index should be 1');

  // Verify Bob (p2) is RESTORED to active status in Round 2!
  assert(game.rounds[1].playerStates['p2'].status === 'current_turn' || game.rounds[1].playerStates['p2'].status === 'active', 'Bob should be active/restored in round 2');
  assert(game.rounds[1].playerStates['p2'].status !== 'out_by_error', 'Bob should NOT be out_by_error in round 2');

  // 7. Verify Cumulative Ranking (Lowest score wins)
  const ranking = engine.getCumulativeScores();
  assert(ranking[0].player.id === 'p1' && ranking[0].totalPoints === 0, 'Ana should be rank 1 with 0 pts');
  assert(ranking[1].player.id === 'p3' && ranking[1].totalPoints === 25, 'Carlos should be rank 2 with 25 pts');
  assert(ranking[2].player.id === 'p2' && ranking[2].totalPoints === 150, 'Bob should be rank 3 with 150 pts');

  console.log('✅ ALL RummyEngine Unit Tests Passed Successfully!');
}

// Execute tests
runRummyEngineTests();
