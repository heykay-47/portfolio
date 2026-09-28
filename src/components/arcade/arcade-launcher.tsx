"use client";

import { useMotionPlayback } from "@/components/motion-playback-provider";
import { Gamepad2, X } from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ArcadeContent } from "./arcade-engine";
import ArcadeWarp from "./arcade-warp";
import "./arcade.css";

const ArcadeGame = dynamic(() => import("./arcade-game"), { ssr: false });
const loadGame = () => import("./arcade-game");

const SIZE = 52;
const CONTENT_WIDTH = 672;
const DOCK_CLEARANCE = 110;
const DISMISSED_KEY = "portfolio-arcade-dismissed";

/** A random spot that never covers the content column on wide screens or the dock. */
function safeSpot() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const gutter = (width - CONTENT_WIDTH) / 2;
  const top = 72;
  const bottom = Math.max(top, height - SIZE - DOCK_CLEARANCE);
  const y = top + Math.random() * (bottom - top);
  const right = Math.random() < 0.5;
  if (gutter >= SIZE + 32) {
    const x = 16 + Math.random() * (gutter - SIZE - 32);
    return { x: right ? width - SIZE - x : x, y };
  }
  // Narrow screens have no gutters, so hug either edge.
  return { x: right ? width - SIZE - 12 : 12, y };
}

type Phase = "idle" | "warping" | "playing";

export default function ArcadeLauncher({ content }: { content: ArcadeContent }) {
  const { isMotionPaused } = useMotionPlayback();
  const [phase, setPhase] = useState<Phase>("idle");
  const [held, setHeld] = useState(false);
  // Dismissal lasts for the browser session, so a returning visitor can still find the game.
  const [dismissed, setDismissed] = useState(false);
  const controls = useAnimationControls();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const originalScroll = useRef(0);
  const destination = useRef<"projects" | undefined>(undefined);
  const active = phase !== "idle";

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISSED_KEY)) setDismissed(true); // eslint-disable-line react-hooks/set-state-in-effect -- storage is client-only
    } catch { /* Storage is optional. */ }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { window.sessionStorage.setItem(DISMISSED_KEY, "1"); } catch { /* Optional. */ }
  };

  useEffect(() => {
    const place = (spot: { x: number; y: number }, travel: boolean) =>
      travel
        ? controls.start({ ...spot, opacity: 1, transition: { type: "spring", stiffness: 26, damping: 9, mass: 1.1 } })
        : controls.set({ ...spot, opacity: 1 });
    const width = window.innerWidth;
    const gutter = (width - CONTENT_WIDTH) / 2;
    void place({ x: width - SIZE - (gutter >= SIZE + 32 ? Math.min(gutter / 2, 116) : 12), y: window.innerHeight / 2 - SIZE / 2 }, false);
    const onResize = () => void place(safeSpot(), false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [controls]);

  useEffect(() => {
    if (isMotionPaused || held || active || dismissed) return;
    let timer: ReturnType<typeof setTimeout>;
    const hop = () => {
      timer = setTimeout(() => {
        void controls.start({ ...safeSpot(), transition: { type: "spring", stiffness: 26, damping: 9, mass: 1.1 } });
        hop();
      }, 3800 + Math.random() * 3200);
    };
    hop();
    return () => {
      clearTimeout(timer);
      controls.stop();
    };
  }, [controls, isMotionPaused, held, active, dismissed]);

  const launch = () => {
    originalScroll.current = window.scrollY;
    destination.current = undefined;
    void loadGame();
    setPhase("warping");
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
    setPhase("idle");
  }, []);
  const warped = useCallback(() => setPhase("playing"), []);

  return (
    <>
      {!dismissed && (
        <motion.div
          className="arcade-launcher-wrap"
          initial={{ opacity: 0 }}
          animate={controls}
          onHoverStart={() => setHeld(true)}
          onHoverEnd={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
          hidden={active}
        >
          <motion.button
            ref={buttonRef}
            type="button"
            className="arcade-launcher"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={launch}
            aria-label="Play the portfolio arcade game"
            title="Play arcade mode"
          >
            <Gamepad2 className={isMotionPaused ? "" : "arcade-launcher-icon"} size={21} strokeWidth={1.8} aria-hidden="true" />
            <span className="arcade-launcher-label" aria-hidden="true">PLAY</span>
          </motion.button>
          <button type="button" className="arcade-launcher-dismiss" onClick={dismiss} aria-label="Hide the arcade game button" title="Hide">
            <X size={11} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </motion.div>
      )}
      {phase === "warping" && createPortal(<ArcadeWarp onComplete={warped} />, document.body)}
      {phase === "playing" && createPortal(<ArcadeGame content={content} onExit={exit} />, document.body)}
    </>
  );
}
