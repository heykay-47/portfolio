/* eslint-disable @next/next/no-img-element */
"use client";

import BlurFade from "@/components/magicui/blur-fade";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createGame, resizeGame, stepGame, type ArcadeContent, type Game, type GameEvent } from "./arcade-engine";
import { drawGame } from "./arcade-renderer";

export type Fragment = { x: number; y: number; width: number; height: number; label: string; image?: string };

type Stage = "entering" | "ready" | "playing" | "paused" | "won" | "lost" | "leaving";

export default function ArcadeGame({
  content,
  fragments,
  onExit,
}: {
  content: ArcadeContent;
  fragments: Fragment[];
  onExit: (destination?: "projects") => void;
}) {
  const [stage, setStage] = useState<Stage>("entering");
  const [sound, setSound] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return Number(window.localStorage.getItem("portfolio-arcade-best-v1")) || 0; }
    catch { return 0; }
  });
  const bestRef = useRef(best);
  const [health, setHealth] = useState(3);
  const [wave, setWave] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef<HTMLButtonElement>(null);
  const gameRef = useRef<Game | null>(null);
  const keysRef = useRef(new Set<string>());
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const touchRef = useRef(false);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const audioRef = useRef<AudioContext | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    touchRef.current = window.matchMedia("(pointer: coarse)").matches;
    for (const project of content.projects) {
      if (!project.image || imagesRef.current.has(project.image)) continue;
      const image = new Image();
      image.src = project.image;
      imagesRef.current.set(project.image, image);
    }
    const readyTimer = window.setTimeout(() => setStage("ready"), 850);
    return () => {
      window.clearTimeout(readyTimer);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
      void audioRef.current?.close();
    };
  }, [content.projects]);

  useEffect(() => {
    if (stage === "ready") readyRef.current?.focus();
  }, [stage]);

  const playSound = useCallback((event: GameEvent) => {
    if (!sound || event === "wave") return;
    try {
      const audio = audioRef.current ?? new AudioContext();
      audioRef.current = audio;
      if (audio.state === "suspended") void audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      const frequency = event === "pickup" || event === "won" ? 720 : event === "hit" || event === "lost" ? 170 : 320;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * (event === "hit" ? 0.45 : 1.3)), now + 0.13);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.17);
    } catch { /* Audio is an optional enhancement. */ }
  }, [sound]);

  const updateBest = useCallback((value: number) => {
    if (value <= bestRef.current) return;
    bestRef.current = value;
    try { window.localStorage.setItem("portfolio-arcade-best-v1", String(value)); } catch { /* Optional. */ }
    setBest(value);
  }, []);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current = createGame(canvas.clientWidth, canvas.clientHeight, content);
    keysRef.current.clear();
    pointerRef.current = null;
    setScore(0);
    setHealth(3);
    setWave(1);
    setStage("playing");
    canvas.focus();
  }, [content]);

  const leave = useCallback((destination?: "projects") => {
    if (exitTimerRef.current) return;
    setStage("leaving");
    exitTimerRef.current = setTimeout(() => onExit(destination), 320);
  }, [onExit]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code) && stage === "playing") {
        event.preventDefault();
      }
      if (event.code === "Escape") {
        event.preventDefault();
        if (stage === "playing") setStage("paused");
        else if (stage === "paused") setStage("playing");
        else if (stage !== "leaving") leave();
      }
      keysRef.current.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const onBlur = () => {
      keysRef.current.clear();
      pointerRef.current = null;
      if (stage === "playing") setStage("paused");
    };
    const onVisibility = () => {
      if (document.hidden) onBlur();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stage, leave]);

  useEffect(() => {
    if (stage !== "playing") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !gameRef.current) return;
    let frame = 0;
    let last = performance.now();
    let lastHud = 0;
    const dark = document.documentElement.classList.contains("dark");
    const fit = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (gameRef.current && (gameRef.current.width !== width || gameRef.current.height !== height)) {
        resizeGame(gameRef.current, width, height);
      }
    };
    fit();
    window.addEventListener("resize", fit);
    const onEvent = (event: GameEvent) => {
      const game = gameRef.current;
      if (!game) return;
      playSound(event);
      setScore(game.score);
      setHealth(game.health);
      setWave(game.wave);
      if (event === "won" || event === "lost") {
        updateBest(game.score);
        setStage(event);
      }
    };
    const render = (now: number) => {
      const game = gameRef.current;
      if (!game) return;
      const keys = keysRef.current;
      stepGame(game, (now - last) / 1000, {
        x: Number(keys.has("ArrowRight") || keys.has("KeyD")) - Number(keys.has("ArrowLeft") || keys.has("KeyA")),
        y: Number(keys.has("ArrowDown") || keys.has("KeyS")) - Number(keys.has("ArrowUp") || keys.has("KeyW")),
        firing: touchRef.current || keys.has("Space"),
        target: pointerRef.current,
      }, onEvent);
      last = now;
      drawGame(ctx, game, imagesRef.current, dark);
      if (now - lastHud > 250) {
        setScore(game.score);
        lastHud = now;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, [stage, playSound, updateBest]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (event.pointerType === "touch") touchRef.current = true;
  };

  return (
    <div className={`arcade-overlay ${stage === "leaving" ? "arcade-leaving" : ""}`} role="dialog" aria-modal="true" aria-label="Portfolio arcade mode">
      <canvas
        ref={canvasRef}
        className="arcade-canvas"
        tabIndex={-1}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); point(event); }}
        onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) point(event); }}
        onPointerUp={() => { pointerRef.current = null; }}
        onPointerCancel={() => { pointerRef.current = null; }}
      />

      {stage === "entering" && fragments.map((fragment, index) => (
        <div
          key={`${fragment.label}-${index}`}
          className="arcade-fragment"
          style={{ left: fragment.x, top: fragment.y, width: fragment.width, height: fragment.height, animationDelay: `${index * 35}ms` }}
        >
          {fragment.image ? <img src={fragment.image} alt="" /> : <span>{fragment.label}</span>}
        </div>
      ))}

      {stage !== "entering" && stage !== "ready" && (
        <div className="arcade-hud">
          <div className="arcade-hud-stats">
            <span>WAVE {wave === 4 ? "FINAL" : `${wave}/3`}</span>
            <span>SCORE {score.toString().padStart(5, "0")}</span>
            <span>HULL {"◆".repeat(Math.max(0, health))}{"◇".repeat(3 - Math.max(0, health))}</span>
          </div>
          <div className="arcade-hud-actions">
            <button type="button" onClick={() => setSound((enabled) => !enabled)} aria-label={sound ? "Mute game sound" : "Enable game sound"} title={sound ? "Mute" : "Sound"}>
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button type="button" onClick={() => setStage(stage === "playing" ? "paused" : "playing")} disabled={stage === "won" || stage === "lost" || stage === "leaving"} aria-label={stage === "paused" ? "Resume game" : "Pause game"} title={stage === "paused" ? "Resume" : "Pause"}>
              {stage === "paused" ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button type="button" onClick={() => leave()} aria-label="Exit arcade mode" title="Exit"><X size={18} /></button>
          </div>
        </div>
      )}

      {(stage === "ready" || stage === "paused" || stage === "won" || stage === "lost") && (
        <div className="arcade-curtain">
          <BlurFade delay={0}>
            <div className="arcade-panel">
              <span className="arcade-kicker">KRITHIK / ARCADE MODE</span>
              {stage === "ready" ? (
                <>
                  <h2>Portfolio, in flight.</h2>
                  <p>The page becomes the playfield. Collect projects and skill upgrades. Clear three waves and the final craft.</p>
                  <div className="arcade-instructions"><span>DESKTOP<br /><strong>Move: arrows / WASD<br />Fire: Space · Pause: Esc</strong></span><span>TOUCH<br /><strong>Drag to steer<br />Automatic fire</strong></span></div>
                  <button ref={readyRef} type="button" className="arcade-primary" onClick={start}>Start flight <span aria-hidden="true">↗</span></button>
                  <button type="button" className="arcade-text-button" onClick={() => leave()}>Return to portfolio</button>
                </>
              ) : stage === "paused" ? (
                <><h2>Flight paused.</h2><p>Your run is waiting here.</p><button type="button" className="arcade-primary" onClick={() => { setStage("playing"); canvasRef.current?.focus(); }}>Resume flight</button><button type="button" className="arcade-text-button" onClick={() => leave()}>Return to portfolio</button></>
              ) : (
                <><h2>{stage === "won" ? "Sky cleared." : "Flight over."}</h2><p>{stage === "won" ? "You made it through the portfolio." : "The next run starts whenever you do."}</p><div className="arcade-result"><span>YOUR SCORE <strong>{score}</strong></span><span>PERSONAL BEST <strong>{best}</strong></span></div><button type="button" className="arcade-primary" onClick={start}>Play again</button><button type="button" className="arcade-text-button" onClick={() => leave()}>Return to portfolio</button><button type="button" className="arcade-text-button" onClick={() => leave("projects")}>Explore projects ↗</button></>
              )}
            </div>
          </BlurFade>
        </div>
      )}
    </div>
  );
}
