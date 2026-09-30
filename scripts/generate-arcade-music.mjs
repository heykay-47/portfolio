// Original compositions and sample-free synthesis for this portfolio.
// Generated recordings are dedicated to CC0; see public/audio/arcade/CREDITS.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sampleRate = 32000;
const output = fileURLToPath(new URL("../public/audio/arcade/", import.meta.url));
mkdirSync(output, { recursive: true });

function compose(name, bpm, baseNote, seed, boss) {
  const beat = 60 / bpm;
  const length = Math.round(16 * 4 * beat * sampleRate);
  const mix = new Float64Array(length);
  let randomState = seed;
  const noise = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 2147483648 - 1;
  };
  const hz = (note) => 440 * 2 ** ((note - 69) / 12);
  const add = (time, duration, voice, level) => {
    const start = Math.round(time * sampleRate);
    const count = Math.round(duration * sampleRate);
    for (let i = 0; i < count; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t / 0.003) * Math.min(1, (duration - t) / 0.014);
      mix[(start + i) % length] += voice(t) * envelope * level;
    }
  };
  const guitar = (note, duration) => {
    const f = hz(note);
    return (t) => {
      let signal = 0;
      for (const ratio of [1, 1.4983, 2]) {
        for (let harmonic = 1; harmonic <= 6; harmonic++) {
          signal += Math.sin(2 * Math.PI * f * ratio * harmonic * t) * Math.exp(-harmonic * t * 4) / harmonic;
          signal += Math.sin(2 * Math.PI * f * ratio * harmonic * 1.003 * t) * Math.exp(-harmonic * t * 4) / (harmonic * 2);
        }
      }
      return Math.tanh(signal * 2.7) * Math.exp(-t / (duration * 0.48));
    };
  };
  const kick = (t) => Math.tanh(2.2 * Math.sin(2 * Math.PI * (46 * t + 1.7 * (1 - Math.exp(-t * 32))))) * Math.exp(-t * 17);
  const snare = (t) => (noise() * 0.8 + Math.sin(2 * Math.PI * 185 * t) * 0.3) * Math.exp(-t * 19);
  let lastNoise = 0;
  const hat = (t) => {
    const current = noise();
    const high = current - lastNoise;
    lastNoise = current;
    return high * Math.exp(-t * 65);
  };
  const roots = boss
    ? [0, 0, 1, 6, 0, 3, 1, 7, 0, 5, 3, 1, 6, 3, 1, 0]
    : [0, 0, 3, 1, 0, 5, 3, 6, 0, 0, 7, 3, 5, 1, 3, 0];
  const riff = boss
    ? [0, 0, null, 12, 0, 0, 7, 0, null, 0, 3, 0, 0, 12, null, 1]
    : [0, null, 0, 0, 7, null, 0, 12, 0, 0, null, 3, 0, null, 7, 0];
  for (let bar = 0; bar < 16; bar++) {
    const root = baseNote + roots[bar];
    for (let step = 0; step < 16; step++) {
      const at = (bar * 4 + step / 4) * beat;
      const note = riff[(step + (bar % 4 === 3 ? 4 : 0)) % 16];
      if (note !== null) {
        const duration = beat * (step % 4 === 0 ? 0.44 : 0.24);
        add(at, duration, guitar(root + note, duration), 0.34);
        const bassHz = hz(root - 12);
        add(at, beat * 0.3, (t) => (Math.sin(2 * Math.PI * bassHz * t) + 0.18 * Math.sin(2 * Math.PI * bassHz * 2 * t)) * Math.exp(-t * 8), 0.24);
      }
      if ([0, 6, 8, 11].includes(step) || (boss && [2, 3, 10, 14].includes(step))) add(at, 0.3, kick, 0.65);
      if (step === 4 || step === 12) add(at, 0.28, snare, 0.38);
      if (step % 2 === 0 || boss) add(at, 0.09, hat, step % 4 === 0 ? 0.075 : 0.04);
      if (bar % 4 === 3 && step >= 13) {
        const tomHz = 160 - (step - 13) * 28;
        add(at, 0.22, (t) => Math.sin(2 * Math.PI * tomHz * t) * Math.exp(-t * 17), 0.24);
      }
      if (bar >= 8 && step % 4 === 2) {
        const leadHz = hz(root + 24 + [0, 7, 10, 3][Math.floor(step / 4)]);
        add(at, beat * 0.7, (t) => Math.tanh(Math.sin(2 * Math.PI * leadHz * t) * 2) * Math.exp(-t * 10), 0.055);
      }
    }
    const padHz = hz(root + 12);
    add(bar * 4 * beat, 4 * beat, (t) => Math.sin(Math.PI * t / (4 * beat)) * (Math.sin(2 * Math.PI * padHz * t) + 0.3 * Math.sin(2 * Math.PI * padHz * 1.4983 * t)), 0.025);
  }
  let sum = 0;
  for (const sample of mix) sum += sample;
  const mean = sum / length;
  let peak = 0;
  for (let i = 0; i < length; i++) {
    mix[i] = Math.tanh((mix[i] - mean) * 1.2);
    // A 2 ms edge ramp prevents an encoded loop-boundary click.
    mix[i] *= Math.min(1, i / 64, (length - 1 - i) / 64);
    peak = Math.max(peak, Math.abs(mix[i]));
  }
  const wav = Buffer.alloc(44 + length * 2);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(length * 2, 40);
  for (let i = 0; i < length; i++) wav.writeInt16LE(Math.round(mix[i] / peak * 0.8 * 32767), 44 + i * 2);
  writeFileSync(`${output}/${name}.wav`, wav);
  console.log(`${name}: ${(length / sampleRate).toFixed(3)}s, ${wav.length} bytes`);
}

compose("rail-forge", 144, 38, 4701, false);
compose("core-breach", 168, 36, 4702, true);
