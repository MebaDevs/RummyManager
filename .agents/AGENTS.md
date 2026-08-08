# Contexto de Proyecto: Rummy Timer — Fase 1 (V0.1 → V1.0)

Este archivo define los principios arquitectónicos, las reglas del juego, la estructura por capas y la guía de desarrollo que **deben cumplirse estrictamente** en cualquier sesión de trabajo en este repositorio.

---

## 🎯 Visión y Alcance
- **Tecnologías principales:** React 18 + Vite + TypeScript.
- **Enfoque actual (Fase 1):** Aplicación 100% local, offline-first y totalmente funcional (V0.1 a V1.0).

---

## 🏗️ Principios Arquitectónicos
1. **Local-first (Offline total):** La V1.0 funciona sin backend ni conexión. Toda la partida vive en el dispositivo.
2. **Motor Independiente (`domain/` & `engine/`):** La lógica de las reglas del juego de Rummy es TypeScript puro y no conoce nada sobre React, modales, botones o el DOM.
3. **Temporizador por Timestamps:** El temporizador calcula el tiempo transcurrido con marcas de tiempo reales (`startedAt`, `pausedAt`, `now`) y `performance.now()`. Nunca se confía en ticks de `setInterval`.
4. **Estado Explícito:** La partida sigue una máquina de estados estricta (`setup` -> `playing` [sub-estados `running`/`paused`] -> `round_finished` -> `finished`).
5. **Persistencia Aislada (Repository Pattern):** React no interactúa directamente con `localStorage`. Toda persistencia pasa por `IGameRepository` (ej. `LocalGameRepository`).
6. **Evolución Online:** El modelo de dominio es 100% serializable para poder sustituir `LocalGameRepository` por `ApiGameRepository` en la V2 sin cambiar las reglas del juego.

---

## 📂 Estructura por Capas (Separación de Responsabilidades)
```
src/
├─ domain/                     # Reglas de dominio (0 React, 0 DOM)
│  ├─ models/                  # Contratos e interfaces TypeScript
│  ├─ rules/                   # Evaluadores de reglas y penalizaciones
│  └─ engine/                  # RummyEngine (Máquina de estados determinista)
├─ application/                # Casos de Uso / Servicios de Aplicación
│  └─ useCases/                # Operaciones de alto nivel (StartGame, ApplyGameError, EndTurn, FinishRound)
├─ infrastructure/             # Persistencia y Servicios de Soporte
│  ├─ storage/                 # IGameRepository, LocalGameRepository
│  └─ audio/                   # WebAudioNotifier (Sintetizador de sonido)
├─ hooks/                      # Custom Hooks React (useRummyEngine, usePreciseTimer, useSoundEffects)
├─ context/                    # GameContext / Provider de Estado Global
├─ components/                 # Componentes UI (Atómicos y reutilizables)
└─ pages/                      # Páginas de Navegación principales
```

---

## 📋 Reglas de Juego e Infracciones (Rummy)

1. **Temporizador de Turno:**
   - Tiempo de turno configurable (por defecto 120s).
   - Al llegar a 0s, dispara Timeout: aplica penalización configurable (ej. +20 pts) y avanza automáticamente al siguiente jugador.

2. **Sanción Especial "Error de Juego" (+150 Pts):**
   - Acción de penalización inmediata durante cualquier turno.
   - Suma **+150 puntos** de penalización al jugador.
   - Marca al jugador como **`out_by_error`** y **lo saca de la ronda actual** (no vuelve a tener turnos en la ronda en curso).
   - El jugador eliminado de la ronda **reingresa automáticamente al comenzar la siguiente ronda**.

3. **Puntuación y Ganador:**
   - El ganador del juego es el jugador con **MENOR cantidad de puntos acumulados**.
   - Al cerrar la ronda (Victoria de un jugador), los jugadores activos ingresan la suma de sus cartas retenidas. El ganador de ronda suma 0 pts.

---

## 🚀 Roadmap de Versiones (Fase 1)
- **V0.1:** Fundación técnica (Vite + React + TS), layout y modelos. *(Completado)*
- **V0.2:** Configuración de partida, lista de jugadores, reglas y rondas. *(Completado base)*
- **V0.3:** Game Engine y máquina de estados en TypeScript puro.
- **V0.4:** Temporizador preciso por timestamps y Web Audio API.
- **V0.5:** Puntuación acumulada, tabla de posiciones y modal Scoreboard.
- **V0.6:** Integración completa de Timeout y Error de Juego (+150 pts).
- **V0.7:** Cierre de ronda, ingreso de puntos de cartas y rotación de inicio.
- **V0.8:** Historial y auditoría detallada del origen de puntajes.
- **V0.9:** Persistencia local continua (autoguardado/recuperación en reload).
- **V1.0:** Release local offline estable y empaquetado.
