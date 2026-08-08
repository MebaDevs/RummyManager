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

## 🃏 Rondas Oficiales de Rummy (6 Rondas)
1. **Ronda 1:** 1 Terna + 1 Escalera
2. **Ronda 2:** 3 Ternas
3. **Ronda 3:** 2 Ternas + 1 Escalera
4. **Ronda 4:** 2 Escaleras
5. **Ronda 5:** 2 Escaleras + 1 Terna
6. **Ronda 6:** 3 Escaleras (Cierre de partida)

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

## 📱 Reglas Estrictas de Layout Responsive y Contención de Botones (OBLIGATORIO)

Cualquier agente que modifique componentes UI, estilos CSS o layouts **debe cumplir estrictamente las siguientes reglas**:

1. **Sin desbordamientos horizontales (Zero Horizontal Overflow):**
   - NUNCA asignar `width` o `minWidth` fijos mayores a `100%` ni `flex` rígidos sin `max-width: 100%`.
   - Todos los botones (`.btn`, `<button>`) y contenedores (`.glass-panel`, `div`) DEBEN tener `max-width: 100% !important` y `box-sizing: border-box !important`.
   - En pantallas móviles (`@media (max-width: 600px)`), los botones de acción principales DEBEN tener `width: 100% !important;` y flex wrapping activado (`flex-wrap: wrap`).

2. **Texto de Botones Respetuoso con Pantallas Pequeñas:**
   - NUNCA usar `white-space: nowrap` en botones con icono y texto que puedan superar el ancho de 320px-390px. Usar `white-space: normal`, `word-break: break-word` o ajuste flexible.

3. **Intercepción del Botón Atrás en Modales:**
   - Todos los modales, modales de confirmación y drawers laterales DEBEN implementar `useModalBackHandler(isOpen, onClose)` para que presionar el botón "Atrás" en móviles o navegadores cierre el modal sin abandonar la página.

4. **Orden Vertical Móvil en Mesa de Juego (`ActiveGamePage`):**
   - 1º Ronda Actual -> 2º Temporizador Circular -> 3º Controles de Turno (`BottomToolbar`) -> 4º Lista de Jugadores (Jugador Activo siempre de 1º).

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
