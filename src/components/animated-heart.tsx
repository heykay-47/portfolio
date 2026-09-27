"use client";

import { useMotionPlayback } from "@/components/motion-playback-provider";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function AnimatedHeart() {
  const { isMotionPaused } = useMotionPlayback();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <motion.span
      className="inline-flex shrink-0"
      initial={{ scale: 0.25, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.7 }}
      onViewportEnter={() => setIsVisible(true)}
      onViewportLeave={() => setIsVisible(false)}
      transition={{ type: "spring", stiffness: 420, damping: 12 }}
    >
      <Heart
        className={`size-10 fill-red-500 text-red-500 sm:size-12 ${isVisible ? "heart-beat" : ""} ${isMotionPaused ? "motion-paused" : ""}`}
        aria-hidden="true"
      />
    </motion.span>
  );
}
