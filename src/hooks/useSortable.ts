import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Reliable pointer-events based drag-to-sort hook.
 * Works on all browsers without relying on the HTML5 Drag & Drop API,
 * which causes "frozen screen" issues in some React + browser combinations.
 *
 * Usage:
 *   const { draggingIndex, overIndex, handleHandleMouseDown, handleItemMouseEnter } =
 *     useSortable(players, (reordered) => setPlayers(reordered));
 */
export function useSortable<T>(
  items: T[],
  onChange: (reordered: T[]) => void
) {
  // Index of the row currently being dragged (-1 = none)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  // Index of the row the user is hovering over
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Keep refs in sync so the global mouseup closure always reads the latest values
  const draggingRef = useRef<number | null>(null);
  const overRef = useRef<number | null>(null);
  const itemsRef = useRef<T[]>(items);
  itemsRef.current = items;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const cleanup = useCallback(() => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    draggingRef.current = null;
    overRef.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }, []);

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
      cleanup();
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [cleanup]);

  /**
   * Call this on the drag-handle element's `onMouseDown`.
   */
  const handleHandleMouseDown = useCallback((index: number) => {
    draggingRef.current = index;
    overRef.current = index;
    setDraggingIndex(index);
    setOverIndex(index);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    (document.body.style as unknown as Record<string, string>).webkitUserSelect = 'none';
  }, []);

  /**
   * Call this on the whole row's `onMouseEnter`.
   * Only does something while dragging.
   */
  const handleItemMouseEnter = useCallback((index: number) => {
    if (draggingRef.current !== null) {
      overRef.current = index;
      setOverIndex(index);
    }
  }, []);

  return { draggingIndex, overIndex, handleHandleMouseDown, handleItemMouseEnter };
}
