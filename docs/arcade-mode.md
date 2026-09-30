# Portfolio arcade mode

The homepage has an optional glass launcher that springs to a random viewport-safe spot every few seconds: inside the side gutters on wide screens, hugging either edge on narrow ones, always clear of the dock. Hover, focus, and the existing decorative-motion control hold it still. The blog has no launcher.

Launching plays a 1.5s hyperspace handoff (`arcade-warp.tsx`): visible page pieces are cloned in place, the live page is hidden in the same frame, and the clones lift off then recede along Z into a shared perspective origin while light streaks race outward. Only transform, opacity, and (desktop only) filter animate, via Motion's WAAPI-backed `animate`. A veil ends on the arcade background colour, so the separate full-screen game appears without a flash. The live page remains intact and inert underneath; exiting restores its scroll position and focus. The game bundle is loaded only when the visitor opens it.

The vertical playfield reuses the portfolio's visual language. Borders and timelines form rails, project screenshots become scenery and score pickups, skill labels become temporary upgrades, and the gold banner treatment becomes the jet's shots and pickups. Asteroids, hostile ships, interceptors, aliens, and the final craft are threats. Portfolio projects remain scenery and rewards, never targets.

The authored rounds introduce threats before combining them:

1. A warned straight shot and an asteroid lane with an escape gap.
2. An interceptor that moves into its warned firing lane, a charged rail pulse, and combinations with ships and interceptors.
3. A moving-gap debris gate alone, then with a ship, and finally with a flanking alien.

Each beat has a finite reinforcement schedule rather than an endless random spawn loop. No more than two ordinary ships or aliens are alive together, and repeated environmental hazards do not stack their own type. Clearing a beat's threats advances after its read window. A per-beat timeout clears leftovers, and 45/50/55-second round caps guarantee progress. Short intermissions clear danger and offer an optional reward or repair. Deterministic steering simulations finish a successful run in about 2:54–3:13; unfamiliar-player timing and reachable escape routes still need human feedback.

The final craft has three phases:

1. A slow opening volley followed by a wing-opening, lane-outlined fan with a marked escape gap.
2. A warned lane lock followed by an aimed shot.
3. A moving-gap gate followed by a warned fan volley.

Each pattern clears before the exposed core's counter window. Power cannot skip a phase, and each phase visibly transforms into the next. The boss has 60 health split across three phases. An unpowered, centered-fire simulation cleared it in about 66 seconds. Steering, upgrades and nova can shorten the fight, but every phase still presents its attack and counterattack opportunity. These measurements are automated, not evidence from unfamiliar players.

Seven upgrades arrive every few seconds during rounds or drop from destroyed enemies: shield, rapid, wide, power for double damage, magnet to pull pickups, repair for one hull, and nova to clear the sky and heavily damage the boss. Kills trigger hit flashes, shockwave rings, screen shake, score popups, and a combo multiplier up to ×3. Large asteroids shatter into fragments. Destroying the craft slows time for a 4.2-second "Boss defeated" title card before results. The result screen offers replay, return, and a projects shortcut. The best score is kept only in this browser's local storage.

- **Desktop:** Arrow keys or WASD to steer, Space to fire, Escape to pause or resume.
- **Touch:** Drag on the playfield to steer; firing is automatic. On-screen pause, sound, and exit controls remain available.
- **Sound:** Audio is off on each new arcade entry. Ready/Pause offer explicit enable, separate music/effects choices, music level and soundtrack credits. Start/Resume/Unmute supply the browser's playback gesture; a failed request or blocked playback offers Retry audio without stopping the game. The HUD master mute preserves underlying choices across pause/replay. Pause, blur and hidden tabs stop audio progression; resume honors mute, and results/exit stop playback. Exit also closes the audio context. No music is fetched on ordinary portfolio load or while Ready waits.
- **Motion:** This opt-in experience follows the portfolio's deliberate always-on motion policy even under `prefers-reduced-motion: reduce`. It has independent manual pause and exit controls and auto-pauses when the tab loses focus. The ordinary dock is hidden during play.

There is no separate nonvisual version of the real-time game. Ordinary portfolio content and navigation remain available before launch and after exit.

## Soundtrack

The rounds use **Rail Forge**, a 144 BPM industrial-metal instrumental. The boss uses the faster **Core Breach**, at 168 BPM. Both are original, sample-free procedural compositions made for this portfolio, with distorted power chords, bass, drums and a synth layer. They do not copy DOOM music or use its recordings. The generator is `scripts/generate-arcade-music.mjs`; the recordings and CC0 reuse terms are in `public/audio/arcade/`. That dedication applies only to these generated audio assets, not the rest of the portfolio.

The two mono PCM WAV loops total 3.17 MB. Only the selected track is fetched and decoded during opted-in play; decoded buffers are reused within that visit. Web Audio provides sample-buffer looping and reliable music-level control rather than a media-element volume setting. Boss phases do not restart the track. The documented external CC0 candidates were not shipped because their downloads failed certificate validation.

See [audio and run verification](arcade-audio-verification.md) for provenance, checksums, browser checks, measured timing and honest limits on audition/device coverage.
