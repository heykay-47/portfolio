"use client";

import { useMotionPlayback } from "@/components/motion-playback-provider";
import { Gamepad2 } from "lucide-react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArcadeContent } from "./arcade-engine";
import type { Fragment } from "./arcade-game";
import "./arcade.css";

const ArcadeGame = dynamic(() => import("./arcade-game"), { ssr: false });

function visibleFragments(): Fragment[] {
  const elements = document.querySelectorAll<HTMLElement>(
    "main h1, main h2, main #hero img, main #hero .firecracker, main #projects img, main #skills span, main #work img, main #education img, main #contact a",
  );
  return Array.from(elements)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const image = element instanceof HTMLImageElement ? element.currentSrc || element.src : undefined;
      return {
        x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        label: element.getAttribute("alt") || element.textContent?.trim().slice(0, 28) || "Portfolio",
        image,
      };
    })
    .filter((fragment) => fragment.width > 15 && fragment.height > 10 && fragment.y < window.innerHeight && fragment.y + fragment.height > 0)
    .slice(0, 12);
}

export default function ArcadeLauncher({ content }: { content: ArcadeContent }) {
  const { isMotionPaused } = useMotionPlayback();
  const [active, setActive] = useState(false);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const originalScroll = useRef(0);
  const destination = useRef<"projects" | undefined>(undefined);

  const launch = () => {
    originalScroll.current = window.scrollY;
    destination.current = undefined;
    setFragments(visibleFragments());
    setActive(true);
  };

  useEffect(() => {
    if (!active) return;
    const main = document.querySelector("main");
    const dock = document.querySelector<HTMLElement>("[data-portfolio-dock]");
    const previousOverflow = document.body.style.overflow;
    const previousMainInert = main?.inert;
    const previousDockInert = dock?.inert;
    const launchButton = buttonRef.current;
    document.body.classList.add("arcade-active");
    document.body.style.overflow = "hidden";
    if (main) main.inert = true;
    if (dock) dock.inert = true;
    return () => {
      document.body.classList.remove("arcade-active");
      document.body.style.overflow = previousOverflow;
      if (main) main.inert = previousMainInert ?? false;
      if (dock) dock.inert = previousDockInert ?? false;
      requestAnimationFrame(() => {
        if (destination.current === "projects") document.getElementById("projects")?.scrollIntoView();
        else window.scrollTo({ top: originalScroll.current, behavior: "instant" });
        launchButton?.focus({ preventScroll: true });
      });
    };
  }, [active]);

  const exit = useCallback((target?: "projects") => {
    destination.current = target;
    setActive(false);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`arcade-launcher ${isMotionPaused ? "arcade-launcher-paused" : ""}`}
        onClick={launch}
        aria-label="Play the portfolio arcade game"
        title="Play arcade mode"
        hidden={active}
      >
        <Gamepad2 size={21} strokeWidth={1.8} aria-hidden="true" />
        <span className="arcade-launcher-label" aria-hidden="true">PLAY</span>
      </button>
      {active && createPortal(
        <ArcadeGame content={content} fragments={fragments} onExit={exit} />,
        document.body,
      )}
    </>
  );
}
