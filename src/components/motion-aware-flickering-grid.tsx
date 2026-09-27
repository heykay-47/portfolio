"use client";

import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useMotionPlayback } from "@/components/motion-playback-provider";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof FlickeringGrid>, "paused">;

export default function MotionAwareFlickeringGrid(props: Props) {
  const { isMotionPaused } = useMotionPlayback();

  return (
    <FlickeringGrid
      {...props}
      aria-hidden="true"
      paused={isMotionPaused}
    />
  );
}
