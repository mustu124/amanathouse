import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Traps Tab/Shift+Tab within the modal while open, moves focus into it on
// open, and restores focus to whatever was focused before on close — the
// baseline behavior every dialog in the app should have.
export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    const focusables = () =>
      container ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];

    const focusTimeout = window.setTimeout(() => {
      const first = focusables()[0];
      (first ?? container)?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !container) return;
      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimeout);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  return containerRef;
}
