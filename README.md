# Core Defense

An original browser arcade game built for the make.fun bounty [best-game-01](https://make.fun/bounty/best-game-01).

You are the wisp guarding a glowing core at the heart of a dead constellation. Gloom wisps drift in from the dark to erode it — split them with your beam before they touch the core. Every banish feeds your combo; every hit dims the core. Survive the surge, chase the multiplier, defend the light.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit http://localhost:8080).

- **Move** — mouse (the wisp follows your cursor) or arrow keys / WASD
- **Beam** — hold left mouse button or Space; the beam splits gloom wisps it touches
- **Pause** — P or Esc; **Restart** — R or the button on game over

Chain banishes without missing or getting hit to grow the combo. At combo x8+ the core surges: the beam widens and wisps burn brighter. Lose all three core segments and the constellation goes dark.

`?shot=start|play|end&seed=N` stages a scene for screenshots. `?seed=N` fixes the whole run deterministically.

## Structure

- `game/` — the playable game as static files (plain ES modules, no build step)
- `main.ts` — copies `game/` + `screenshots/` to the output dir and writes `dossier.json`
- `vendor/makefun-game.ts` — vendored from the make.fun kit, unchanged
- `screenshots/` — real renders of the game in a headless browser

MIT licensed. Source written end-to-end by an AI coding agent (session transcripts bundled with the entry).
