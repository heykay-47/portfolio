# Portfolio arcade mode

The homepage has an optional floating launcher that travels between the outer edges of the viewport. The existing decorative-motion control pauses its travel. The blog has no launcher.

Launching captures recognizable elements from the current viewport for a brief handoff, then opens a separate full-screen game. The live page remains intact and inert underneath; exiting restores its scroll position and focus. The game bundle is loaded only when the visitor opens it.

The vertical playfield reuses the portfolio's visual language: its borders and timelines form rails, project screenshots become scenery and score pickups, skill labels become temporary upgrades, and the gold banner treatment becomes the jet's shots and pickups. Asteroids, hostile ships, and aliens are the targets, never the projects. Three 18-second waves lead to a final craft; the result screen offers replay, return, and a projects shortcut. The best score is kept only in this browser's local storage.

- **Desktop:** Arrow keys or WASD to steer, Space to fire, Escape to pause or resume.
- **Touch:** Drag on the playfield to steer; firing is automatic. On-screen pause, sound, and exit controls remain available.
- **Sound:** Optional effects, muted by default; no music.
- **Motion:** This opt-in experience follows the portfolio's deliberate always-on motion policy even under `prefers-reduced-motion: reduce`. It has independent manual pause and exit controls and auto-pauses when the tab loses focus. The ordinary dock is hidden during play.

There is no separate nonvisual version of the real-time game. Ordinary portfolio content and navigation remain available before launch and after exit.
