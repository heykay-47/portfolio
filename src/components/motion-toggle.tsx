"use client";

import { Button } from "@/components/ui/button";
import { useMotionPlayback } from "@/components/motion-playback-provider";
import { PauseIcon, PlayIcon } from "lucide-react";

export default function MotionToggle({ className }: { className?: string }) {
  const { isMotionPaused, toggleMotion } = useMotionPlayback();
  const label = isMotionPaused
    ? "Resume decorative motion"
    : "Pause decorative motion";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      aria-pressed={isMotionPaused}
      title={label}
      onClick={toggleMotion}
    >
      {isMotionPaused ? (
        <PlayIcon className="size-4" aria-hidden="true" />
      ) : (
        <PauseIcon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
