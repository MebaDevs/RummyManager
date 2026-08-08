import { GameSettings, RoundObjective } from '../models';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  turnTimeLimitSeconds: 120,
  timeoutPenalty: 20,
  gameErrorPenalty: 150,
  warningSeconds: 15,
  soundEnabled: true,
  autoAdvanceOnTimeout: false, // Por defecto, continua cronometrando sin cambiar de turno
};

export const DEFAULT_RUMMY_ROUNDS: RoundObjective[] = [
  {
    number: 1,
    name: 'Ronda 1: 1 Terna + 1 Escalera',
    description: 'Bajar 1 grupo del mismo número (terna) y 1 secuencia corrida del mismo palo (escalera).',
    setsNeeded: 1,
    runsNeeded: 1,
  },
  {
    number: 2,
    name: 'Ronda 2: 3 Ternas',
    description: 'Bajar 3 grupos de 3 o más cartas del mismo número (ternas).',
    setsNeeded: 3,
    runsNeeded: 0,
  },
  {
    number: 3,
    name: 'Ronda 3: 2 Ternas + 1 Escalera',
    description: 'Bajar 2 grupos del mismo número y 1 secuencia corrida del mismo palo.',
    setsNeeded: 2,
    runsNeeded: 1,
  },
  {
    number: 4,
    name: 'Ronda 4: 2 Escaleras',
    description: 'Bajar 2 secuencias corridas del mismo palo (escaleras).',
    setsNeeded: 0,
    runsNeeded: 2,
  },
  {
    number: 5,
    name: 'Ronda 5: 2 Escaleras + 1 Terna',
    description: 'Bajar 2 secuencias corridas del mismo palo y 1 grupo del mismo número.',
    setsNeeded: 1,
    runsNeeded: 2,
  },
  {
    number: 6,
    name: 'Ronda 6: 3 Escaleras',
    description: 'Bajar 3 secuencias corridas del mismo palo (cierre de partida).',
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
