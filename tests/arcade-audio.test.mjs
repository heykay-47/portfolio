import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ArcadeAudio } from "../src/components/arcade/arcade-audio.ts";

function browserAudio() {
  const sources = [];
  const requests = [];
  const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const context = {
    state: "suspended", currentTime: 0, destination: {},
    resume: async () => { context.state = "running"; },
    close: async () => { context.state = "closed"; },
    createGain: () => ({ gain: parameter(), connect() {}, disconnect() {} }),
    decodeAudioData: async () => ({ duration: 20 }),
    createBufferSource: () => {
      const source = { loop: false, buffer: null, starts: [], stopped: false, connect() {}, disconnect() {},
        start: (...args) => source.starts.push(args), stop: () => { source.stopped = true; } };
      sources.push(source);
      return source;
    },
    createOscillator: () => ({ frequency: parameter(), connect() { return { connect() {} }; }, start() {}, stop() {}, disconnect() {} }),
  };
  return { context, sources, requests, platform: {
    createContext: () => context,
    fetchAudio: async (url) => { requests.push(url); return new ArrayBuffer(1); },
  } };
}

test("audio stays unloaded until gameplay is explicitly opted in and loops the rounds track", async () => {
  const browser = browserAudio();
  const audio = new ArcadeAudio(() => {}, browser.platform);
  audio.start();
  await audio.unlock();
  assert.equal(browser.requests.length, 0);
  audio.configure({ enabled: true, music: true, effects: true, volume: 0.3 });
  await audio.unlock();
  assert.deepEqual(browser.requests, ["/audio/arcade/rail-forge.wav"]);
  assert.equal(browser.sources.length, 1);
  assert.equal(browser.sources[0].loop, true);
  await audio.dispose();
});

test("pause, master mute, boss handoff and replay never leave overlapping tracks", async () => {
  const browser = browserAudio();
  const audio = new ArcadeAudio(() => {}, browser.platform);
  const settings = { enabled: true, music: true, effects: false, volume: 0.4 };
  audio.configure(settings);
  audio.start();
  await audio.unlock();
  browser.context.currentTime = 9;
  audio.pause();
  assert.equal(browser.sources[0].stopped, true);
  audio.resume();
  await audio.unlock();
  assert.deepEqual(browser.sources[1].starts, [[0, 9]]);

  audio.configure({ ...settings, enabled: false });
  assert.equal(browser.sources[1].stopped, true);
  audio.setTrack("boss");
  assert.equal(browser.requests.length, 1, "muted boss entry must not fetch music");
  audio.configure(settings);
  await audio.unlock();
  assert.deepEqual(browser.requests, ["/audio/arcade/rail-forge.wav", "/audio/arcade/core-breach.wav"]);
  assert.equal(browser.sources.filter((source) => !source.stopped).length, 1);
  audio.setTrack("boss");
  assert.equal(browser.sources.filter((source) => !source.stopped).length, 1, "boss phases must not restart music");

  audio.stop();
  assert.equal(browser.sources.filter((source) => !source.stopped).length, 0);
  audio.start();
  await audio.unlock();
  assert.deepEqual(browser.sources.at(-1).starts, [[0, 0]]);
  assert.equal(browser.requests.length, 2, "replay uses the visit's decoded buffers");
  await audio.dispose();
  assert.equal(browser.context.state, "closed");
});

test("a late music download cannot play after pause or exit", async () => {
  for (const exit of [false, true]) {
    const browser = browserAudio();
    let resolveDownload;
    browser.platform.fetchAudio = () => new Promise((resolve) => { resolveDownload = resolve; });
    const audio = new ArcadeAudio(() => {}, browser.platform);
    audio.configure({ enabled: true, music: true, effects: true, volume: 0.4 });
    audio.start();
    const loading = audio.unlock();
    await Promise.resolve();
    if (exit) await audio.dispose();
    else audio.pause();
    resolveDownload(new ArrayBuffer(1));
    await loading;
    assert.equal(browser.sources.length, 0);
    await audio.dispose();
  }
});

test("a failed audio request can be retried manually without restarting the game", async () => {
  const browser = browserAudio();
  let requests = 0;
  const statuses = [];
  browser.platform.fetchAudio = async () => {
    if (++requests === 1) throw new Error("offline");
    return new ArrayBuffer(1);
  };
  const audio = new ArcadeAudio((status) => statuses.push(status), browser.platform);
  audio.configure({ enabled: true, music: true, effects: false, volume: 0.4 });
  audio.start();
  await audio.unlock();
  assert.equal(statuses.at(-1), "error");
  await audio.unlock();
  assert.equal(statuses.at(-1), "playing");
  assert.equal(browser.sources.length, 1);
  await audio.dispose();
});

test("both original music assets are audible, bounded PCM loops with click-free endpoints", () => {
  let totalBytes = 0;
  for (const name of ["rail-forge", "core-breach"]) {
    const wav = readFileSync(new URL(`../public/audio/arcade/${name}.wav`, import.meta.url));
    totalBytes += wav.length;
    assert.equal(wav.toString("ascii", 0, 4), "RIFF");
    assert.equal(wav.toString("ascii", 8, 12), "WAVE");
    assert.equal(wav.readUInt16LE(20), 1);
    assert.equal(wav.readUInt16LE(22), 1);
    assert.equal(wav.readUInt32LE(24), 32000);
    assert.equal(wav.readUInt16LE(34), 16);
    assert.equal(wav.readInt16LE(44), 0);
    assert.equal(wav.readInt16LE(wav.length - 2), 0);
    let sum = 0;
    let squares = 0;
    let peak = 0;
    const count = (wav.length - 44) / 2;
    for (let i = 44; i < wav.length; i += 2) {
      const sample = wav.readInt16LE(i) / 32768;
      sum += sample;
      squares += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    assert.ok(peak < 0.81, "leave output headroom for effects");
    assert.ok(Math.abs(sum / count) < 0.01, "no significant DC offset");
    assert.ok(Math.sqrt(squares / count) > 0.05, "a silent file does not satisfy music playback");
    assert.ok(count / 32000 > 20 && count / 32000 < 30);
  }
  assert.ok(totalBytes < 3_500_000, "keep the optional soundtrack payload modest");
});
