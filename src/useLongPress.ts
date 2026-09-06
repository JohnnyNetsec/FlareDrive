// Copyright (c) 2024-2026 NETSEC (https://51sec.org).
// SPDX-License-Identifier: MIT
import { useCallback, useRef } from "react";

// Touch devices have no right-click, so long-press is the equivalent
// gesture for entering/extending multi-selection. Desktop mouse behavior
// (right-click) is untouched, since only touch* events are wired here.
//
// Call this hook once per component (not per list item — only one touch
// sequence can be active at a time, so a single shared timer is enough).
// It returns a factory that produces plain event-handler objects per item,
// so list rendering code never has to call a hook inside a loop.
export function useLongPress(delay = 500) {
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);

  const clear = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return useCallback(
    (onLongPress: () => void) => ({
      onTouchStart: () => {
        triggeredRef.current = false;
        clear();
        timerRef.current = window.setTimeout(() => {
          triggeredRef.current = true;
          onLongPress();
        }, delay);
      },
      onTouchMove: clear,
      onTouchEnd: (e: React.TouchEvent) => {
        clear();
        if (triggeredRef.current) {
          // Suppress the synthetic click mobile browsers fire after
          // touchend, which would otherwise immediately open the item.
          e.preventDefault();
        }
      },
    }),
    [delay]
  );
}
