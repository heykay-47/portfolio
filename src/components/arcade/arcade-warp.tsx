"use client";

import { animate } from "motion";
import { useEffect, useRef } from "react";

/** Visible page pieces that detach and fall into hyperspace, outermost first. */
const PIECE_SELECTOR = [
  "main #hero h1", "main #hero p", "main #hero img", "main #hero a",
  "main h2", "main section p", "main section img", "main section a",
  "main section li", "main section [data-slot='badge']", "main .firecracker",
  "[data-portfolio-dock] > *",
].join(", ");
const MAX_PIECES = 36;
export const WARP_DURATION = 1500;

function capturePieces() {
  const seen: HTMLElement[] = [];
  for (const element of document.querySelectorAll<HTMLElement>(PIECE_SELECTOR)) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 12 || rect.height < 8 || rect.bottom < 0 || rect.top > window.innerHeight) continue;
    // Nested matches would travel twice; keep the outermost piece only.
    if (seen.some((piece) => piece.contains(element) || element.contains(piece))) continue;
    seen.push(element);
    if (seen.length === MAX_PIECES) break;
  }
  return seen.map((element) => {
    const rect = element.getBoundingClientRect();
    const clone = element.cloneNode(true) as HTMLElement;
    const style = getComputedStyle(element);
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    Object.assign(clone.style, {
      position: "absolute", left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`, margin: "0",
      color: style.color, font: style.font, opacity: style.opacity,
    });
    return { clone, rect };
  });
}

/**
 * Hyperspace handoff: page pieces lift off, then recede along Z toward the
 * shared perspective origin while light streaks race outward. Everything
 * animates transform, opacity, or filter so the compositor carries the motion.
 */
export default function ArcadeWarp({ onComplete }: { onComplete: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const streaksRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const done = useRef(onComplete);

  useEffect(() => {
    const stage = stageRef.current;
    const streakLayer = streaksRef.current;
    const veil = veilRef.current;
    if (!stage || !streakLayer || !veil) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const compact = width < 640 || window.matchMedia("(pointer: coarse)").matches;
    const reach = Math.hypot(width, height) / 2;
    const pieces = capturePieces();
    // Clones exist now; hiding the live page in the same frame avoids any flash.
    document.body.classList.add("arcade-warping");

    const controls = pieces.map(({ clone, rect }) => {
      stage.appendChild(clone);
      const dx = rect.left + rect.width / 2 - width / 2;
      const dy = rect.top + rect.height / 2 - height / 2;
      const distance = Math.hypot(dx, dy) / reach;
      // Pieces tilt so their outer edge faces the tunnel wall, then fall inward.
      const tiltX = (dy / height) * 28;
      const tiltY = (-dx / width) * 28;
      return animate(clone, {
        transform: [
          "translate3d(0,0,0)",
          `translate3d(${dx * 0.05}px, ${dy * 0.05}px, 60px) rotateX(${tiltX * 0.3}deg) rotateY(${tiltY * 0.3}deg)`,
          `translate3d(${-dx * 0.35}px, ${-dy * 0.35}px, -2600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        ],
        opacity: [1, 1, 0],
        filter: compact ? undefined : ["blur(0px)", "blur(0px)", "blur(5px)"],
      }, {
        duration: 1.05,
        delay: (1 - distance) * 0.12 + Math.random() * 0.06,
        times: [0, 0.22, 1],
        ease: ["easeOut", [0.7, 0, 0.9, 0.3]],
      });
    });

    const streakCount = compact ? 42 : 90;
    const streaks = Array.from({ length: streakCount }, (_, index) => {
      const streak = document.createElement("span");
      const angle = (index / streakCount) * 360 + Math.random() * 6;
      const start = reach * (0.04 + Math.random() * 0.2);
      streak.className = index % 7 === 0 ? "arcade-streak arcade-streak-gold" : "arcade-streak";
      streakLayer.appendChild(streak);
      return animate(streak, {
        transform: [
          `rotate(${angle}deg) translateX(${start}px) scaleX(0.02)`,
          `rotate(${angle}deg) translateX(${start * 2}px) scaleX(0.5)`,
          `rotate(${angle}deg) translateX(${reach * 1.3}px) scaleX(1)`,
        ],
        opacity: [0, 0.9, 0],
      }, {
        duration: 0.8,
        delay: 0.3 + Math.random() * 0.35,
        times: [0, 0.45, 1],
        ease: [0.55, 0, 1, 0.45],
      });
    });

    // The veil ends on the arcade background colour, so the game fades in over itself.
    const veilControl = animate(veil, { opacity: [0, 0, 1] }, { duration: WARP_DURATION / 1000, times: [0, 0.6, 1], ease: "easeIn" });
    veilControl.finished.then(() => done.current(), () => {});

    return () => {
      [...controls, ...streaks, veilControl].forEach((control) => control.stop());
      stage.replaceChildren();
      streakLayer.replaceChildren();
      document.body.classList.remove("arcade-warping");
    };
  }, []);

  return (
    <div className="arcade-warp" aria-hidden="true">
      <div ref={stageRef} className="arcade-warp-stage" />
      <div ref={streaksRef} className="arcade-warp-streaks" />
      <div ref={veilRef} className="arcade-warp-veil" />
    </div>
  );
}
