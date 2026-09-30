export type AudioSettings = { enabled: boolean; music: boolean; effects: boolean; volume: number };
export type AudioStatus = "idle" | "loading" | "playing" | "error";
type Track = "rounds" | "boss";
type AudioPlatform = {
  createContext: () => AudioContext;
  fetchAudio: (url: string) => Promise<ArrayBuffer>;
};
const TRACKS: Record<Track, string> = {
  rounds: "/audio/arcade/rail-forge.wav",
  boss: "/audio/arcade/core-breach.wav",
};
const browserPlatform: AudioPlatform = {
  createContext: () => new AudioContext(),
  fetchAudio: async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
    return response.arrayBuffer();
  },
};

// Owns one visit's audio. Nothing is created or fetched before a play gesture.
export class ArcadeAudio {
  private settings: AudioSettings = { enabled: false, music: true, effects: true, volume: 0.4 };
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private buffers = new Map<Track, Promise<AudioBuffer>>();
  private oscillators = new Set<OscillatorNode>();
  private track: Track = "rounds";
  private offset = 0;
  private startedAt = 0;
  private active = false;
  private disposed = false;
  private revision = 0;
  private report: (status: AudioStatus) => void;
  private platform: AudioPlatform;

  constructor(report: (status: AudioStatus) => void, platform: AudioPlatform = browserPlatform) {
    this.report = report;
    this.platform = platform;
  }

  configure(settings: AudioSettings) {
    if (this.disposed) return;
    this.settings = { ...settings, volume: Math.max(0, Math.min(1, settings.volume)) };
    if (this.master) this.master.gain.value = settings.enabled ? 1 : 0;
    if (this.musicGain) this.musicGain.gain.value = this.settings.volume * 0.35;
    if (!settings.enabled || !settings.music) {
      this.stopMusic(false);
      this.report("idle");
    } else if (!this.source) void this.ensureMusic();
    if (!settings.enabled || !settings.effects) this.stopEffects();
  }

  // Must be called synchronously by Start, Resume, Unmute or Retry.
  async unlock() {
    if (this.disposed || !this.settings.enabled || (!this.settings.music && !this.settings.effects)) return;
    try {
      if (!this.context) {
        const context = this.platform.createContext();
        this.context = context;
        this.master = context.createGain();
        this.musicGain = context.createGain();
        this.effectsGain = context.createGain();
        this.master.gain.value = 1;
        this.musicGain.gain.value = this.settings.volume * 0.35;
        this.effectsGain.gain.value = 1;
        this.musicGain.connect(this.master);
        this.effectsGain.connect(this.master);
        this.master.connect(context.destination);
      }
      await this.context.resume();
      if (!this.disposed && this.context.state === "running") await this.ensureMusic();
      else if (!this.disposed) this.report("error");
    } catch {
      if (!this.disposed && this.active && this.settings.enabled) this.report("error");
    }
  }

  start() {
    this.stopMusic(true);
    this.stopEffects();
    this.track = "rounds";
    this.active = true;
    if (!this.disposed) this.report("idle");
  }

  resume() { this.active = true; }

  pause() {
    this.active = false;
    this.stopMusic(false);
    this.stopEffects();
    if (!this.disposed) this.report("idle");
  }

  stop() {
    this.pause();
    this.offset = 0;
  }

  setTrack(track: Track) {
    if (track === this.track) return;
    this.stopMusic(true);
    this.track = track;
    void this.ensureMusic();
  }

  playEffect(event: string) {
    const context = this.context;
    if (!this.active || !this.settings.enabled || !this.settings.effects || !context || context.state !== "running") return;
    if (event === "wave" || event === "intermission") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const frequency = event === "pickup" || event === "won" || event === "felled" ? 720 : event === "hit" || event === "lost" ? 170 : 320;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * (event === "hit" ? 0.45 : 1.3)), now + 0.13);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    oscillator.connect(gain);
    gain.connect(this.effectsGain!);
    this.oscillators.add(oscillator);
    oscillator.onended = () => { this.oscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + 0.17);
  }

  async dispose() {
    this.disposed = true;
    this.stop();
    this.buffers.clear();
    if (this.context && this.context.state !== "closed") await this.context.close().catch(() => {});
  }

  private stopEffects() {
    for (const oscillator of this.oscillators) {
      oscillator.stop();
      oscillator.disconnect();
    }
    this.oscillators.clear();
  }

  private stopMusic(reset: boolean) {
    this.revision += 1;
    if (this.source) {
      if (this.context) this.offset += this.context.currentTime - this.startedAt;
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    if (reset) this.offset = 0;
  }

  private async ensureMusic() {
    const context = this.context;
    if (this.disposed || !this.active || !this.settings.enabled || !this.settings.music || !context || context.state !== "running" || this.source) return;
    const revision = ++this.revision;
    const track = this.track;
    this.report("loading");
    try {
      let pending = this.buffers.get(track);
      if (!pending) {
        pending = this.platform.fetchAudio(TRACKS[track]).then((data) => context.decodeAudioData(data));
        this.buffers.set(track, pending);
        void pending.catch(() => { if (this.buffers.get(track) === pending) this.buffers.delete(track); });
      }
      const buffer = await pending;
      if (this.disposed || revision !== this.revision || !this.active || !this.settings.enabled || !this.settings.music) return;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.musicGain!);
      this.offset %= buffer.duration;
      this.startedAt = context.currentTime;
      this.source = source;
      this.musicGain!.gain.setValueAtTime(0, context.currentTime);
      this.musicGain!.gain.linearRampToValueAtTime(this.settings.volume * 0.35, context.currentTime + 0.16);
      source.start(0, this.offset);
      this.report("playing");
    } catch {
      if (!this.disposed && revision === this.revision) this.report("error");
    }
  }
}
