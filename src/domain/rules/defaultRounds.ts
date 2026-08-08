import { GameSettings, RoundObjective } from '../models';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  turnTimeLimitSeconds: 120,
  timeoutPenalty: 20,
  gameErrorPenalty: 150,
  warningSeconds: 15,
  soundEnabled: true,
};

export const DEFAULT_RUMMY_ROUNDS: RoundObjective[] = [
  {
    number: 1,
    name: 'Ronda 1: 2 Ternas',
    description: 'Bajar 2 grupos de 3 o más cartas del mismo número/letra.',
    setsNeeded: 2,
    runsNeeded: 0,
  },
  {
    number: 2,
    name: 'Ronda 2: 1 Terna + 1 Escalera',
    description: 'Bajar 1 grupo del mismo número y 1 secuencia corrida del mismo palo.',
    setsNeeded: 1,
    runsNeeded: 1,
  },
  {
    number: 3,
    name: 'Ronda 3: 2 Escaleras',
    description: 'Bajar 2 secuencias corridas de 4 o más cartas del mismo palo.',
    setsNeeded: 0,
    runsNeeded: 2,
  },
  {
    number: 4,
    name: 'Ronda 4: 3 Ternas',
    description: 'Bajar 3 grupos de 3 o más cartas del mismo número.',
    setsNeeded: 3,
    runsNeeded: 0,
  },
  {
    number: 5,
    name: 'Ronda 5: 2 Ternas + 1 Escalera',
    description: 'Bajar 2 grupos del mismo número y 1 secuencia del mismo palo.',
    setsNeeded: 2,
    runsNeeded: 1,
  },
  {
    number: 6,
    name: 'Ronda 6: 1 Terna + 2 Escaleras',
    description: 'Bajar 1 grupo del mismo número y 2 secuencias del mismo palo.',
    setsNeeded: 1,
    runsNeeded: 2,
  },
  {
    number: 7,
    name: 'Ronda 7: 3 Escaleras (Cierre)',
    description: 'Bajar 3 secuencias corridas completas para terminar el juego.',
    setsNeeded: 0,
    runsNeeded: 3,
  },
];

export const AVATAR_COLORS = [
  '#9b5cff', // Vibrant Purple
  '#35e58a', // Emerald Green
  '#ff5365', // Crimson Red
  '#48a7ff', // Electric Blue
  '#ffc83d', // Amber Gold
  '#ff79c6', // Neon Pink
  '#00f2fe', // Cyan Glow
  '#ff922b', // Warm Orange
];
