"use client";

import BlurFade from "@/components/magicui/blur-fade";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArcadeAudio, type AudioSettings, type AudioStatus } from "./arcade-audio";
import {
  createGame, DIFFICULTIES, resizeGame, stepGame,
  type ArcadeContent, type DifficultyLevel, type Game, type GameEvent, type StartLevel,
} from "./arcade-engine";
import { drawGame } from "./arcade-renderer";

type Stage = "ready" | "playing" | "paused" | "won" | "lost" | "leaving";
type FlightSettings = { startLevel: StartLevel; difficulty: DifficultyLevel };

const FLIGHT_SETTINGS_KEY = "portfolio-arcade-flight-v1";
const LEVELS: { value: StartLevel; label: string }[] = [
  { value: 1, label: "Round 1" },
  { value: 2, label: "Round 2" },
  { value: 3, label: "Round 3" },
  { value: 4, label: "Boss" },
];
const DIFFICULTY_NOTES: Record<DifficultyLevel, string> = {
  1: "The original tuning. Long warnings and generous pickups.",
  2: "Craft fly in pairs, faster, with quicker fire and tighter gaps.",
  3: "Reinforcements keep coming and take an extra hit. The boss calls escorts.",
  4: "Three-ship squads, short warnings and a tougher final craft.",
  5: "A crowded sky, rapid fire and barely any recovery time.",
};

function readFlightSettings(): FlightSettings {
  const fallback: FlightSettings = { startLevel: 1, difficulty: 3 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(FLIGHT_SETTINGS_KEY) ?? "null");
    const startLevel = LEVELS.some((level) => level.value === saved?.startLevel) ? saved.startLevel : fallback.startLevel;
    const difficulty = saved?.difficulty in DIFFICULTIES ? saved.difficulty : fallback.difficulty;
    return { startLevel, difficulty };
  } catch { return fallback; }
}

export default function ArcadeGame({
  content,
  onExit,
}: {
  content: ArcadeContent;
  onExit: (destination?: "projects") => void;
}) {
  const [stage, setStage] = useState<Stage>("ready");
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({ enabled: false, music: true, effects: true, volume: 0.4 });
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return Number(window.localStorage.getItem("portfolio-arcade-best-v1")) || 0; }
    catch { return 0; }
  });
  const bestRef = useRef(best);
  const [flight, setFlight] = useState<FlightSettings>(readFlightSettings);
  const [health, setHealth] = useState(3);
  const [wave, setWave] = useState(1);
  const [bossPhase, setBossPhase] = useState(1);
  const [announcement, setAnnouncement] = useState("Ready");
  const [felled, setFelled] = useState(false);
  const [upgrades, setUpgrades] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const previousStageRef = useRef<Stage>("ready");
  const gameRef = useRef<Game | null>(null);
  const keysRef = useRef(new Set<string>());
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const touchRef = useRef(false);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const audioRef = useRef<ArcadeAudio | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    touchRef.current = window.matchMedia("(pointer: coarse)").matches;
    for (const project of content.projects) {
      if (!project.image || imagesRef.current.has(project.image)) continue;
      const image = new Image();
      image.src = project.image;
      imagesRef.current.set(project.image, image);
    }
    return () => {
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, [content.projects]);

  useEffect(() => () => {
    void audioRef.current?.dispose();
    audioRef.current = null;
  }, []);

  useEffect(() => {
    if (stage === "ready" || stage === "paused" || stage === "won" || stage === "lost") {
      primaryActionRef.current?.focus();
    } else if (stage === "playing" && previousStageRef.current === "paused") {
      canvasRef.current?.focus();
    }
    previousStageRef.current = stage;
  }, [stage]);

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new ArcadeAudio(setAudioStatus);
    return audioRef.current;
  }, []);

  const configureAudio = (change: Partial<AudioSettings>) => {
    const next = { ...audioSettings, ...change };
    setAudioSettings(next);
    const audio = getAudio();
    audio.configure(next);
    if (stage === "playing" && next.enabled) void audio.unlock();
  };

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStage("paused");
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.resume();
    void audioRef.current?.unlock();
    setStage("playing");
  }, []);

  const configureFlight = (change: Partial<FlightSettings>) => {
    const next = { ...flight, ...change };
    setFlight(next);
    try { window.localStorage.setItem(FLIGHT_SETTINGS_KEY, JSON.stringify(next)); } catch { /* Optional. */ }
  };

  const updateBest = useCallback((value: number) => {
    if (value <= bestRef.current) return;
    bestRef.current = value;
    try { window.localStorage.setItem("portfolio-arcade-best-v1", String(value)); } catch { /* Optional. */ }
    setBest(value);
  }, []);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { startLevel, difficulty } = flight;
    gameRef.current = createGame(canvas.clientWidth, canvas.clientHeight, content, Math.random, { startLevel, difficulty });
    keysRef.current.clear();
    pointerRef.current = null;
    setScore(0);
    setHealth(3);
    setWave(startLevel);
    setBossPhase(1);
    setAnnouncement(startLevel === 4 ? "Final craft incoming" : `Round ${startLevel} begins`);
    setFelled(false);
    setUpgrades("");
    const audio = getAudio();
    audio.configure(audioSettings);
    audio.start();
    if (startLevel === 4) audio.setTrack("boss");
    void audio.unlock();
    setStage("playing");
    canvas.focus();
  }, [content, getAudio, audioSettings, flight]);

  const leave = useCallback((destination?: "projects") => {
    if (exitTimerRef.current) return;
    audioRef.current?.stop();
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
        if (stage === "playing") pause();
        else if (stage === "paused") resume();
        else if (stage !== "leaving") leave();
      }
      keysRef.current.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const onBlur = () => {
      keysRef.current.clear();
      pointerRef.current = null;
      if (stage === "playing") pause();
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
  }, [stage, leave, pause, resume]);

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
      audioRef.current?.playEffect(event);
      setScore(game.score);
      setHealth(game.health);
      setWave(game.wave);
      if (event === "intermission") setAnnouncement(`Round ${game.wave} clear. Recovery pickup available.`);
      if (event === "wave") {
        if (game.wave === 4) {
          setBossPhase(1);
          audioRef.current?.setTrack("boss");
          setAnnouncement("Final craft incoming");
        } else setAnnouncement(`Round ${game.wave} begins`);
      }
      if (event === "boss-phase" && game.bossFight) {
        setBossPhase(game.bossFight.phase);
        setAnnouncement(`Boss phase ${game.bossFight.phase}`);
      }
      if (event === "felled") setFelled(true);
      if (event === "won" || event === "lost") {
        updateBest(game.score);
        audioRef.current?.stop();
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
        const { player } = game;
        setUpgrades((["shield", "rapid", "wide", "power", "magnet"] as const).filter((name) => player[name] > 0).join(" · ").toUpperCase());
        lastHud = now;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, [stage, updateBest]);

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
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>

      {stage !== "ready" && (
        <div className="arcade-hud">
          <div className="arcade-hud-stats">
            <span>{wave === 4 ? `BOSS ${bossPhase}/3` : `ROUND ${wave}/3`}</span>
            <span>{DIFFICULTIES[flight.difficulty].label.toUpperCase()}</span>
            <span>SCORE {score.toString().padStart(5, "0")}</span>
            <span>HULL {"◆".repeat(Math.max(0, health))}{"◇".repeat(3 - Math.max(0, health))}</span>
            {upgrades && <span className="arcade-hud-upgrades">{upgrades}</span>}
          </div>
          <div className="arcade-hud-actions">
            <button type="button" onClick={() => configureAudio({ enabled: !audioSettings.enabled })} aria-label={audioSettings.enabled ? "Mute game audio" : "Unmute game audio"} aria-pressed={audioSettings.enabled} title={audioSettings.enabled ? "Mute" : "Unmute"}>
              {audioSettings.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button type="button" onClick={stage === "playing" ? pause : resume} disabled={stage === "won" || stage === "lost" || stage === "leaving"} aria-label={stage === "paused" ? "Resume game" : "Pause game"} title={stage === "paused" ? "Resume" : "Pause"}>
              {stage === "paused" ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button type="button" onClick={() => leave()} aria-label="Exit arcade mode" title="Exit"><X size={18} /></button>
          </div>
        </div>
      )}

      {stage === "playing" && audioStatus === "error" && audioSettings.enabled && (
        <div className="arcade-audio-notice" role="status">Audio couldn&apos;t start. <button type="button" onClick={() => void getAudio().unlock()}>Retry audio</button></div>
      )}

      {felled && stage === "playing" && (
        <div className="arcade-felled" role="status">
          <div className="arcade-felled-band" />
          <p className="arcade-felled-title" data-text="BOSS DEFEATED">BOSS DEFEATED</p>
          <p className="arcade-felled-sub">Final craft destroyed · +1000</p>
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
                  <p>The page becomes the playfield. Learn each round, collect project and skill upgrades, then take on the final craft.</p>
                  <div className="arcade-instructions"><span>DESKTOP<br /><strong>Move: arrows / WASD<br />Fire: Space · Pause: Esc</strong></span><span>TOUCH<br /><strong>Drag to steer<br />Automatic fire</strong></span></div>
                  {flightOptions()}
                  {audioOptions()}
                  <button ref={primaryActionRef} type="button" className="arcade-primary" onClick={start}>Start flight <span aria-hidden="true">↗</span></button>
                  <button type="button" className="arcade-text-button" onClick={() => leave()}>Return to portfolio</button>
                </>
              ) : stage === "paused" ? (
                <><h2>Flight paused.</h2><p>Your run is waiting here.</p>{audioOptions()}<button ref={primaryActionRef} type="button" className="arcade-primary" onClick={resume}>Resume flight</button><button type="button" className="arcade-text-button" onClick={() => leave()}>Return to portfolio</button></>
              ) : (
                <><h2>{stage === "won" ? "Sky cleared." : "Flight over."}</h2><p>{stage === "won" ? "You made it through the portfolio." : "The next run starts whenever you do."}</p><div className="arcade-result"><span>YOUR SCORE <strong>{score}</strong></span><span>PERSONAL BEST <strong>{best}</strong></span></div>{flightOptions()}<button ref={primaryActionRef} type="button" className="arcade-primary" onClick={start}>Play again</button><button type="button" className="arcade-text-button" onClick={() => leave()}>Return to portfolio</button><button type="button" className="arcade-text-button" onClick={() => leave("projects")}>Explore projects ↗</button></>
              )}
            </div>
          </BlurFade>
        </div>
      )}
    </div>
  );

  function flightOptions() {
    return (
      <fieldset className="arcade-audio-options arcade-flight-options">
        <legend>Flight</legend>
        <div className="arcade-level-choices">
          {LEVELS.map((level) => (
            <label key={level.value}>
              <input type="radio" name="arcade-start-level" value={level.value} checked={flight.startLevel === level.value} onChange={() => configureFlight({ startLevel: level.value })} />
              {level.label}
            </label>
          ))}
        </div>
        <label className="arcade-audio-level">Difficulty <input type="range" min="1" max="5" step="1" value={flight.difficulty} aria-valuetext={DIFFICULTIES[flight.difficulty].label} onChange={(event) => configureFlight({ difficulty: Number(event.target.value) as DifficultyLevel })} /><span>{DIFFICULTIES[flight.difficulty].label}</span></label>
        <p>{DIFFICULTY_NOTES[flight.difficulty]}</p>
      </fieldset>
    );
  }

  function audioOptions() {
    return (
      <fieldset className="arcade-audio-options">
        <legend>Game audio</legend>
        <label><input type="checkbox" checked={audioSettings.enabled} onChange={(event) => configureAudio({ enabled: event.target.checked })} />Enable game audio</label>
        <div className="arcade-audio-choices">
          <label><input type="checkbox" checked={audioSettings.music} onChange={(event) => configureAudio({ music: event.target.checked })} />Music</label>
          <label><input type="checkbox" checked={audioSettings.effects} onChange={(event) => configureAudio({ effects: event.target.checked })} />Effects</label>
        </div>
        <label className="arcade-audio-level">Music level <input type="range" min="0" max="100" step="5" value={Math.round(audioSettings.volume * 100)} disabled={!audioSettings.music} onChange={(event) => configureAudio({ volume: Number(event.target.value) / 100 })} /><span>{Math.round(audioSettings.volume * 100)}%</span></label>
        <p>{stage === "paused" ? "Audio resumes with your flight. Mute stays muted." : "Off until enabled. Music starts with your flight."}</p>
        {audioStatus === "error" && <p role="status">Audio couldn&apos;t start. Resume to retry, or play muted.</p>}
        <details><summary>Soundtrack credits</summary><p>Rail Forge and Core Breach. Original, sample-free industrial-metal loops made for this portfolio. <a href="/audio/arcade/CREDITS.md" target="_blank" rel="noreferrer">CC0 reuse terms and source notes</a>.</p></details>
      </fieldset>
    );
  }
}
