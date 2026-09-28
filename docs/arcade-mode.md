# Portfolio arcade mode

The homepage has an optional glass launcher that springs to a random viewport-safe spot every few seconds: inside the side gutters on wide screens, hugging either edge on narrow ones, always clear of the dock. Hover, focus, and the existing decorative-motion control hold it still. The blog has no launcher.

Launching plays a 1.5s hyperspace handoff (`arcade-warp.tsx`): visible page pieces are cloned in place, the live page is hidden in the same frame, and the clones lift off then recede along Z into a shared perspective origin while light streaks race outward. Only transform, opacity, and (desktop only) filter animate, via Motion's WAAPI-backed `animate`. A veil ends on the arcade background colour, so the separate full-screen game appears without a flash. The live page remains intact and inert underneath; exiting restores its scroll position and focus. The game bundle is loaded only when the visitor opens it.

The vertical playfield reuses the portfolio's visual language: its borders and timelines form rails, project screenshots become scenery and score pickups, skill labels become temporary upgrades, and the gold banner treatment becomes the jet's shots and pickups. Asteroids, hostile ships, and aliens are the targets, never the projects. Seven upgrades arrive every few seconds or drop from destroyed enemies: shield, rapid, wide, power (double damage), magnet (pulls pickups), repair (+1 hull), and nova (clears the sky; heavy hit on the boss). Kills trigger hit flashes, shockwave rings, screen shake, score popups, and a combo multiplier up to ×3; large asteroids shatter into fragments. Three 18-second waves lead to a final craft with 16 hit points; destroying it slows time for a 4.2-second "Boss defeated" title card before results; the result screen offers replay, return, and a projects shortcut. The best score is kept only in this browser's local storage.

- **Desktop:** Arrow keys or WASD to steer, Space to fire, Escape to pause or resume.
- **Touch:** Drag on the playfield to steer; firing is automatic. On-screen pause, sound, and exit controls remain available.
- **Sound:** Optional effects, muted by default; no music.
- **Motion:** This opt-in experience follows the portfolio's deliberate always-on motion policy even under `prefers-reduced-motion: reduce`. It has independent manual pause and exit controls and auto-pauses when the tab loses focus. The ordinary dock is hidden during play.

There is no separate nonvisual version of the real-time game. Ordinary portfolio content and navigation remain available before launch and after exit.
