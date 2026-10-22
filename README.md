# Guildmaster: The Ember Crown

A dark-fantasy guild management game. You run an adventurers' guild: hire heroes, build parties,
send them on quests across a bird's-eye map, manage stress and reputation, answer crises, and
slay the final boss. Every run earns Legacy points that unlock perks for the next one.

Built with **React 18 + Vite**. The game rules are plain JavaScript modules that know nothing about
React, so the same engine can be tested on its own, moved to TypeScript, or wrapped for desktop
(Electron/Tauri) and mobile (Capacitor).

## Run it

```bash
npm install
npm run dev          # local dev server
npm run build        # production build in dist/
npm run build:single # one self-contained HTML file in dist-single/
npm run lint
```

## Project layout

```
src/
  engine/            Game rules and state. No React, no DOM rendering.
    data.js            Tables: classes, tiers, quirks, quests, chapters, perks, eras, bosses
    art.js             Temporary pixel-art sprites and icons (SVG strings)
    map.js             Map geography, routes and terrain
    game.js            State (S, M, ui), all game logic, the clock, and dispatch()
  ui/                React components (the presentation layer)
    App.jsx            Command deck, guild status, sections
    Quests.jsx         Quest board, mission cards, the zoomable map
    Tabs.jsx           Parties, Roster, Tavern, Guild
    Ledger.jsx         Event history and gold account
    Create.jsx         Founding screen
    Modals.jsx         All dialogs (focus-trapped, Escape closes dismissible ones)
    HeroCard.jsx       Compact and full hero plates
  styles/theme.css   The Ember Crown theme (CSS variables at the top)
legacy/index.html    The previous single-file version, kept for reference and parity tests
tests/parity.cjs     Plays the legacy and React builds with the same random seed and compares state
```

## How state flows

The engine holds mutable state (`S` for the run, `M` for the Legacy meta-game, `ui` for session/view
state). Every control calls `dispatch(action, a, b)`, which mutates state and calls `bump()`. `bump()`
saves to `localStorage` and notifies React (`useSyncExternalStore`). A second channel, `useTick()`,
carries the fast clock so only the day meter and map re-render while time flows.

Saves: `guildmaster-save-v2` (current run), `guildmaster-legacy-v1` (Legacy perks, hall of legends),
`guildmaster-mode` (Manual/Live time).

## Parity test

`tests/parity.cjs` needs Playwright. With `npm run build && npm run preview` running on port 4173:

```bash
node tests/parity.cjs 45 2
```

It runs both versions through a scripted 45-day game with a fixed random seed and compares the
resulting state. The second argument skips the two random numbers React itself consumes at start-up.

## Deploying

Import the repository in Vercel. It detects Vite; `vercel.json` already sets the build command and
output folder.

## Publishing on itch.io

itch.io runs HTML5 games from a ZIP that has `index.html` at its top level. The single-file build is
ideal because there are no asset paths to break.

```bash
npm run build:single      # writes dist-single/index.html
# zip that one file as index.html at the root of the archive
```

On itch.io: create a project, set **Kind of project** to **HTML**, upload the ZIP, tick
**This file will be played in the browser**, and set the viewport to about 1280 x 800 with the
fullscreen button enabled. Saves use `localStorage`; some browsers block it inside third-party
frames (private windows, strict tracking protection), in which case progress lasts only for the
session. The fonts load from Google Fonts.
