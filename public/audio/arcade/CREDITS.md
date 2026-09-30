# Portfolio arcade soundtrack

Original instrumental compositions generated specifically for this portfolio on
2026-09-30 using `scripts/generate-arcade-music.mjs` in the source repository.

- **Rail Forge**: rounds, 144 BPM, 16 bars, 26.667 seconds.
- **Core Breach**: boss, 168 BPM, 16 bars, 22.857 seconds.

The generator synthesizes distorted power chords, bass, kick, snare, hats, toms
and a quiet synth layer from mathematical oscillators and seeded noise. It uses
no downloaded recordings, soundfonts, samples, vocals, or external compositions.
DOOM is a reference for the broad industrial-metal genre, not a source of any
melody, recording, title or branding. The works are procedural, AI-assisted
compositions, not recordings by Kistol or nene. The researched external candidates
were not distributed because secure downloads could not be verified here.

## Reuse terms

The generated compositions and recordings are provided under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
To the extent copyright or related rights exist in these generated assets,
they are waived under CC0, with its fallback license where waiver is ineffective.
You may reuse, adapt, distribute and use them commercially without attribution.
This dedication covers only these two audio assets, not the portfolio's other
code, images, text or third-party material. No claim of universal copyright
clearance or immunity to automated Content ID false positives is made.

## Delivery and provenance

Canonical assets are local mono 32 kHz, 16-bit PCM WAV files. They are synthesized
directly into the final delivery format, with a 2 ms edge ramp and a -1.94 dBFS
peak ceiling. There is no lossy codec padding or external asset dependency.
Music is fetched and decoded only during opted-in gameplay. Web Audio loops the
decoded buffer, with separate music and effects gain controls.

Reproduce exactly with `node scripts/generate-arcade-music.mjs`. Checksums and
waveform/loop checks are recorded in `docs/arcade-audio-verification.md`.
