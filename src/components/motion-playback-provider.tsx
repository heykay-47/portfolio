"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface MotionPlayback {
  isMotionPaused: boolean;
  toggleMotion: () => void;
}

const MotionPlaybackContext = createContext<MotionPlayback | null>(null);

export function MotionPlaybackProvider({ children }: { children: ReactNode }) {
  const [isMotionPaused, setMotionPaused] = useState(false);
  const toggleMotion = useCallback(() => {
    setMotionPaused((paused) => !paused);
  }, []);
  const playback = useMemo(
    () => ({ isMotionPaused, toggleMotion }),
    [isMotionPaused, toggleMotion],
  );

  return (
    <MotionPlaybackContext.Provider value={playback}>
      {children}
    </MotionPlaybackContext.Provider>
  );
}

export function useMotionPlayback() {
  const playback = useContext(MotionPlaybackContext);

  if (!playback) {
    throw new Error("Motion controls must be used within MotionPlaybackProvider");
  }

  return playback;
}
