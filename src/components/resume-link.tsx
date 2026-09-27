"use client";

import { useMotionPlayback } from "@/components/motion-playback-provider";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function ResumeLink({ href }: { href: string }) {
  const { isMotionPaused } = useMotionPlayback();

  return (
    <Button asChild size="lg" variant="ghost">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative pr-12 sm:pr-8 ${isMotionPaused ? "motion-paused" : ""}`}
      >
        View resume
        <span
          aria-hidden="true"
          className="resume-pdf-float absolute right-2 top-1 flex size-6 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 shadow-sm sm:-right-1 sm:-top-2.5 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <FileText className="size-3.5" />
        </span>
      </Link>
    </Button>
  );
}
