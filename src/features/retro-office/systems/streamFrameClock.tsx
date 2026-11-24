"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

declare global {
  interface Window {
    __hermes3dStream?: { fps: number; dpr: number; frames: number; startedAt: number };
  }
}

/**
 * Drives a `frameloop="never"` Canvas at a fixed rate. Every scene system
 * (useFrame) still runs once per rendered frame, but nothing renders between
 * ticks, so stray `invalidate()` calls cannot push the GPU above `fps`.
 */
export function StreamFrameClock({ fps, dpr }: { fps: number; dpr: number }) {
  const advance = useThree((state) => state.advance);

  useEffect(() => {
    const startedAt = performance.now();
    const status = { fps, dpr, frames: 0, startedAt: Date.now() };
    window.__hermes3dStream = status;
    const tick = () => {
      advance((performance.now() - startedAt) / 1000, true);
      status.frames += 1;
    };
    tick();
    const interval = window.setInterval(tick, 1000 / fps);
    return () => window.clearInterval(interval);
  }, [advance, fps, dpr]);

  return null;
}
