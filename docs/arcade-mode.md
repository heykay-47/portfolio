# Portfolio arcade mode

The homepage has an optional glass launcher that springs to a random viewport-safe spot every few seconds: inside the side gutters on wide screens, hugging either edge on narrow ones, always clear of the dock. Hover, focus, and the existing decorative-motion control hold it still. The blog has no launcher.

Launching plays a 1.5s hyperspace handoff (`arcade-warp.tsx`): visible page pieces are cloned in place, the live page is hidden in the same frame, and the clones lift off then recede along Z into a shared perspective origin while light streaks race outward. Only transform, opacity, and (desktop only) filter animate, via Motion's WAAPI-backed `animate`. A veil ends on the arcade background colour, so the separate full-screen game appears without a flash. The live page remains intact and inert underneath; exiting restores its scroll position and focus. The game bundle is loaded only when the visitor opens it.

The vertical playfield reuses the portfolio's visual language. Borders and timelines form rails, project screenshots become scenery and score pickups, skill labels become temporary upgrades, and the gold banner treatment becomes the jet's shots and pickups. Asteroids, hostile ships, interceptors, aliens, and the final craft are threats. Portfolio projects remain scenery and rewards, never targets.

The authored rounds introduce threats before combining them:

1. A warned straight shot and an asteroid lane with an escape gap.
2. An interceptor that moves into its warned firing lane, a charged rail pulse, and combinations with ships and interceptors.
3. A moving-gap debris gate alone, then with a ship, and finally with a flanking alien.

Clearing a beat's threats advances after a short read window. A per-beat timeout clears leftovers, and round caps guarantee progress. Short intermissions clear danger and offer an optional reward or repair. The 45/50/55-second round caps, warnings, and gaps are starting values that still need first-time-player tuning. Reachable escape routes, especially on touch screens, remain a playtest requirement.

The final craft has three phases:

1. A slow opening volley followed by a wing-opening, lane-outlined fan with a marked escape gap.
2. A warned lane lock followed by an aimed shot.
3. A moving-gap gate followed by a warned fan volley.

Each pattern clears before the exposed core's counter window. Power cannot skip a phase, and each phase visibly transforms into the next. The boss has 60 health split across three phases. A deterministic centered-fire run cleared it in about 71 seconds; human playtesting remains outstanding.

Seven upgrades arrive every few seconds during rounds or drop from destroyed enemies: shield, rapid, wide, power for double damage, magnet to pull pickups, repair for one hull, and nova to clear the sky and heavily damage the boss. Kills trigger hit flashes, shockwave rings, screen shake, score popups, and a combo multiplier up to ×3. Large asteroids shatter into fragments. Destroying the craft slows time for a 4.2-second "Boss defeated" title card before results. The result screen offers replay, return, and a projects shortcut. The best score is kept only in this browser's local storage.

- **Desktop:** Arrow keys or WASD to steer, Space to fire, Escape to pause or resume.
- **Touch:** Drag on the playfield to steer; firing is automatic. On-screen pause, sound, and exit controls remain available.
- **Sound:** Optional synthesized effects, muted by default. Music is not yet included; the researched candidates still require secure download, audition, loop, provenance, and browser checks before release.
- **Motion:** This opt-in experience follows the portfolio's deliberate always-on motion policy even under `prefers-reduced-motion: reduce`. It has independent manual pause and exit controls and auto-pauses when the tab loses focus. The ordinary dock is hidden during play.

There is no separate nonvisual version of the real-time game. Ordinary portfolio content and navigation remain available before launch and after exit.
