import { useEffect } from "react";

// Closes a modal/overlay on Escape — shared by every dialog in the app so
// none of them silently miss this baseline accessibility behavior.
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);
}
