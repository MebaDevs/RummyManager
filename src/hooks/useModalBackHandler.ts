import { useEffect, useRef } from 'react';

/**
 * Custom Hook to handle native browser / phone Back Button (`popstate`) for modals & drawers.
 * When `isOpen` becomes true, it pushes a state entry.
 * When the back button is pressed, it closes the modal instead of navigating away from the page.
 */
export const useModalBackHandler = (isOpen: boolean, onClose: () => void) => {
  const isPushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Clean up history entry if closed manually by user
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      }
      return;
    }

    // Push dummy state to browser history when modal opens
    window.history.pushState({ modalOpen: true }, '');
    isPushedRef.current = true;

    const handlePopState = () => {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);
};
