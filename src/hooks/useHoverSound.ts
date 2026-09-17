"use client";

import { useCallback, useRef } from "react";

export function useHoverSound(src: string = "/sounds/hover_sound6.mp3") {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [src]);
}
