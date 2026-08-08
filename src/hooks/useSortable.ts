import { useState, useRef, useEffect, useCallback } from 'react';

/**
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
 */
export function useSortable<T>(
  items: T[],
  onChange: (reordered: T[]) => void
) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Refs keep latest values accessible inside event-listener closures without stale state
  const draggingRef = useRef<number | null>(null);
  const overRef = useRef<number | null>(null);
  const itemsRef = useRef<T[]>(items);
  itemsRef.current = items;
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
    draggingRef.current = null;
    overRef.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }, []);

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
      cleanup();
    };

    window.addEventListener('mouseup', handleMouseUp);
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
  const handleHandleMouseDown = useCallback((index: number) => {
    draggingRef.current = index;
    overRef.current = index;
    setDraggingIndex(index);
    setOverIndex(index);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    (document.body.style as unknown as Record<string, string>).webkitUserSelect = 'none';
  }, []);

  const handleHandleTouchStart = useCallback((_e: React.TouchEvent, index: number) => {
    draggingRef.current = index;
    overRef.current = index;
    setDraggingIndex(index);
    setOverIndex(index);
  }, []);

  // ── Handler to attach to each row ────────────────────────────────────────
  const handleItemMouseEnter = useCallback((index: number) => {
    if (draggingRef.current !== null) {
      overRef.current = index;
      setOverIndex(index);
    }
  }, []);

  return {
    draggingIndex,
    overIndex,
    handleHandleMouseDown,
    handleHandleTouchStart,
    handleItemMouseEnter,
    setRowRef,
  };
}
