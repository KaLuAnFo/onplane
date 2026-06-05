# Guess the Handicap — daily web game

Static, no backend. Lives at **onplaneswing.com/guess** (part of the `onplane` GitHub Pages repo).

## How it works
- `index.html` — the whole game (UI + logic, plain JS + localStorage).
- `puzzles.js` — the daily puzzle schedule. Puzzle shown = days since `LAUNCH_DATE`, in order.
- `clips/` — short swing mp4s.

## Add a new puzzle (the only recurring task)
1. Trim a swing to ~3–6s, export a small **mp4** (≈720p, a few MB). Drop it in `clips/`,
   e.g. `clips/karl-2026-06-12.mp4`.
2. Add an entry to `PUZZLES` in `puzzles.js`:
   ```js
   { video: "clips/karl-2026-06-12.mp4", handicap: 11, hint: "Quick clue", player: "Karl", credit: "@onplaneswing" }
   ```
   - `handicap` = the **real** handicap (whole number) — the answer.
   - Order matters: entries play in sequence from `LAUNCH_DATE`.
3. Commit + push → live in ~1 min.

## Consent
Only use a non-Karl swing **with the person's permission**. The DM flow ("upload your swing") is where
that consent + the real handicap come from. Credit them (or keep anonymous) via the `credit` field.

## Keep it tiny
No accounts, no leaderboard, no backend until the game proves it pulls traffic. If it does, then graduate.
