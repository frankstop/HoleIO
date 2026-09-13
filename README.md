# Project Singularity

A complete, single-player 3D arcade city eater for modern browsers. Start as a tiny void in Riverdale Park, consume progressively larger props, outgrow seven AI rivals, and climb from street litter to skyscrapers before the two-minute timer expires.

## Play locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Create a production build with `npm run build`, or run the gameplay logic tests with `npm test`.

## Controls

- Move with WASD or the arrow keys.
- Move the pointer away from screen center to steer toward it.
- Drag anywhere on a touch screen to use the floating joystick.
- Use the left stick on a connected gamepad.
- Press P or Escape to pause.

## Modes

- **Classic:** 120-second match against seven utility-AI rivals, with predation, score transfer, respawning, a temporary ghost shield, dynamic leaderboard, and final placement.
- **Zen Demolition:** endless solo play with a demolition percentage, reset control, and 0.5×–2× time scale.

## Included systems

- Eight growth tiers and 12 procedurally modeled prop families.
- Four distinct city districts: park, suburbs, metro core, and harbor.
- Custom suction, tumbling, ingestion, growth, camera, and collision logic.
- AI forage, hunt, flee, and wander behaviors.
- Procedural Web Audio music and tier-scaled sound effects.
- Unlockable hole skins and local best-score persistence.
- Responsive HUD, radar, pause/results flows, mute, reduced-motion, and high-contrast preferences.

The optional `?showcase=1` URL parameter starts Classic mode at the Tier-3 visual benchmark when selected; normal play always begins at Tier 1.
