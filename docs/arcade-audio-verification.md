# Arcade audio and encounter verification

Verified locally on 2026-09-30. No production deployment or video-platform
Content ID test was performed.

## Original soundtrack provenance

External candidates from OpenGameArt remained inaccessible to a verified TLS
download. They were not included, and certificate validation was not bypassed.
Instead, the final soundtrack was synthesized from original note schedules,
mathematical oscillators and seeded noise by `scripts/generate-arcade-music.mjs`.
There are no third-party samples, vocals, soundfonts, recordings or borrowed
DOOM melodies. The generation source is the complete, reproducible source of
both recordings. Generated assets have CC0 reuse terms in
`public/audio/arcade/CREDITS.md`; this is not a guarantee against false Content
ID claims or an assertion about other portfolio assets.

| Track | Delivery | Duration | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| Rail Forge | Mono 32 kHz / 16-bit PCM WAV | 26.667 s | 1,706,710 | `c37ee1d362925c02bb777334a673c070db5d049c2162c9c32f36b914fa957f48` |
| Core Breach | Mono 32 kHz / 16-bit PCM WAV | 22.857 s | 1,462,902 | `b5958460f1a64c435ae4babedc7f50186b8f7d4b525db2df140c8fa968027423` |

Both recordings have zero-valued boundary samples, 2 ms edge ramps, no
significant DC offset and a peak ceiling of 0.8. Tests measure a non-silent RMS
and validate their WAV headers and combined 3.5 MB payload budget. PCM has no
lossy encoder delay; looping the decoded AudioBuffer avoids media-element loop
gaps. Music starts with a 160 ms gain ramp and is mixed below its source level.

## Automated and rendered checks

- 64 Node tests pass, including authored reinforcement limits, round progression,
  hazard warning/collision/cleanup, safe-gap labels, resize, boss phases,
  ordinary/upgrade/nova damage, upgrades, score and win/loss behavior.
- Audio platform-boundary tests cover default-off loading, looping, pause/resume
  position, mute, rounds-to-boss switching, replay buffer reuse, delayed request
  completion after pause/exit, disposal, and manual retry after failure.
- TypeScript, lint and production build pass. Lint retains the pre-existing
  generated `allPosts.js` warning. The design detector reports only the existing
  boss-defeat gradient text, which is retained from the original arcade.
- Chromium desktop UI checks confirmed zero audio requests or contexts on
  ordinary load and Ready, even after selecting Enable before Start. Start
  decoded the rounds loop and produced measured output RMS about 0.030.
- Pause stopped the source and produced zero output RMS. Resume began a new
  source at the preserved 4.10-second offset and restored canvas focus.
- Chromium's phone viewport and native CDP touch events confirmed one-pointer
  dragging, movement from x=196.5 to x=282.5, automatic firing and no hull loss
  in that input check. This is touch emulation, not physical iPhone/Safari testing.
- A test-only fast-forward through the ordinary boss-entry path selected and
  decoded the 22.857-second boss loop, with nonzero output RMS about 0.031.
  Fast-forwarding is not represented as a successful human run.
- Muting while paused stayed muted after Resume. Exit closed the AudioContext.
  Reopening showed Enable game audio unchecked, with no surprise playback.
- Light Ready and dark active-game scoped axe audits reported zero violations
  and no incomplete checks. Dark Pause also had zero violations, but contrast
  on the HUD behind its curtain was marked incomplete by axe. Browser error
  logs were empty. Ready/Pause screenshots checked the incumbent light/dark
  styles and phone layout; the curtain scrolls on short viewports.

## Gameplay timing and tuning

Initial whole-run simulations showed sparse rounds. Finite reinforcements now
continue the taught rule within a beat, cap ordinary enemies at two, and avoid
stacked same-type environmental hazards. Six seeded steering simulations at
390×844 and 1280×800 finished successfully in about 174–193 seconds, with two
hulls remaining. The desktop simulations use keyboard-speed horizontal input;
portrait simulations use the same pointer-follow input as touch. These bots
read engine state and are not unfamiliar players.

The unpowered centered-fire benchmark takes about 66 seconds for the boss,
with phase boundaries around 21 and 43 seconds. The hull accepts 0.48 times
ordinary base damage; the open core accepts twice base damage. Segment clamps
and mandatory counter windows keep strong upgrades from skipping a phase.
Skilled steering and upgrades can finish faster, as intended.

## Remaining human checks

This environment has no usable audio output for a genuine listening audition.
Waveform, PCM boundary and browser-output checks are not subjective listening
tests. The music is supplied and plays, but the owner should audition its timbre,
balance and repeated loop seams. No unfamiliar first-time players or physical
mobile/Safari devices were available. Their readability, finger-occlusion,
fairness and subjective fun feedback cannot be fabricated. These are validation
limits, not missing gameplay or soundtrack implementations.
