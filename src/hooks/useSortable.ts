import { useState, useRef, useEffect, useCallback } from 'react';

/**
<<<<<<< HEAD
 * Reliable pointer-events + touch based drag-to-sort hook.
 * Works on desktop (mouse) and mobile (touch) without the HTML5 Drag & Drop API.
 *
 * Usage:
 *   const { draggingIndex, overIndex, handleHandleMouseDown, handleHandleTouchStart,
 *           handleItemMouseEnter, setRowRef } = useSortable(items, onChange);
 *
 * In JSX — each row needs:
 *   ref={(el) => setRowRef(index, el)}
 *   onMouseEnter={() => handleItemMouseEnter(index)}
 *
 * The drag handle needs:
 *   onMouseDown={() => handleHandleMouseDown(index)}
 *   onTouchStart={(e) => handleHandleTouchStart(e, index)}
=======
 * Reliable pointer-events based drag-to-sort hook.
 * Works on all browsers without relying on the HTML5 Drag & Drop API,
 * which causes "frozen screen" issues in some React + browser combinations.
 *
 * Usage:
 *   const { draggingIndex, overIndex, handleHandleMouseDown, handleItemMouseEnter } =
 *     useSortable(players, (reordered) => setPlayers(reordered));
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
 */
export function useSortable<T>(
  items: T[],
  onChange: (reordered: T[]) => void
) {
<<<<<<< HEAD
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Refs keep latest values accessible inside event-listener closures without stale state
=======
  // Index of the row currently being dragged (-1 = none)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  // Index of the row the user is hovering over
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Keep refs in sync so the global mouseup closure always reads the latest values
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
  const draggingRef = useRef<number | null>(null);
  const overRef = useRef<number | null>(null);
  const itemsRef = useRef<T[]>(items);
  itemsRef.current = items;
<<<<<<< HEAD
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // DOM refs for each row — needed to hit-test touch position
  const rowRefs = useRef<(HTMLElement | null)[]>([]);

  const setRowRef = useCallback((index: number, el: HTMLElement | null) => {
    rowRefs.current[index] = el;
  }, []);

  const cleanup = useCallback(() => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    (document.body.style as unknown as Record<string, string>).webkitUserSelect = '';
=======

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const cleanup = useCallback(() => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
    draggingRef.current = null;
    overRef.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }, []);

<<<<<<< HEAD
  const commitReorder = useCallback(() => {
    const from = draggingRef.current;
    const to = overRef.current;
    if (from !== null && to !== null && from !== to) {
      const copy = [...itemsRef.current];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      onChangeRef.current(copy);
    }
  }, []);

  // ── Hit-test: find which row index is under a screen coordinate ───────────
  const findRowAtPoint = useCallback((clientY: number): number | null => {
    const rows = rowRefs.current;
    for (let i = 0; i < rows.length; i++) {
      const el = rows[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) return i;
    }
    return null;
  }, []);

  // ── Global event listeners (mouse + touch) ───────────────────────────────
  useEffect(() => {
    const handleMouseUp = () => {
      if (draggingRef.current === null) return;
      commitReorder();
      cleanup();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (draggingRef.current === null) return;
      // Prevent page scroll while sorting
      e.preventDefault();
      const touch = e.touches[0];
      const idx = findRowAtPoint(touch.clientY);
      if (idx !== null && idx !== draggingRef.current) {
        overRef.current = idx;
        setOverIndex(idx);
      }
    };

    const handleTouchEnd = () => {
      if (draggingRef.current === null) return;
      commitReorder();
=======
  useEffect(() => {
    const handleMouseUp = () => {
      const from = draggingRef.current;
      const to = overRef.current;
      if (from !== null && to !== null && from !== to) {
        const copy = [...itemsRef.current];
        const [moved] = copy.splice(from, 1);
        copy.splice(to, 0, moved);
        onChangeRef.current(copy);
      }
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
      cleanup();
    };

    window.addEventListener('mouseup', handleMouseUp);
<<<<<<< HEAD
    // passive: false is required so we can call e.preventDefault() in touchmove
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [cleanup, commitReorder, findRowAtPoint]);

  // ── Handlers to attach to the drag handle element ────────────────────────
=======
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [cleanup]);

  /**
   * Call this on the drag-handle element's `onMouseDown`.
   */
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
  const handleHandleMouseDown = useCallback((index: number) => {
    draggingRef.current = index;
    overRef.current = index;
    setDraggingIndex(index);
    setOverIndex(index);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    (document.body.style as unknown as Record<string, string>).webkitUserSelect = 'none';
  }, []);

<<<<<<< HEAD
  const handleHandleTouchStart = useCallback((_e: React.TouchEvent, index: number) => {
    // Don't call _e.preventDefault() here — it would block click events on mobile
    draggingRef.current = index;
    overRef.current = index;
    setDraggingIndex(index);
    setOverIndex(index);
  }, []);

  // ── Handler to attach to each row ────────────────────────────────────────
=======
  /**
   * Call this on the whole row's `onMouseEnter`.
   * Only does something while dragging.
   */
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
  const handleItemMouseEnter = useCallback((index: number) => {
    if (draggingRef.current !== null) {
      overRef.current = index;
      setOverIndex(index);
    }
  }, []);

<<<<<<< HEAD
  return {
    draggingIndex,
    overIndex,
    handleHandleMouseDown,
    handleHandleTouchStart,
    handleItemMouseEnter,
    setRowRef,
  };
=======
  return { draggingIndex, overIndex, handleHandleMouseDown, handleItemMouseEnter };
>>>>>>> 802d29080402ee4f73cf83aad327aa8b327db203
}
