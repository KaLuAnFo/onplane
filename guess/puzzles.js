/* OnPlane — Guess the Handicap puzzle schedule.
   The game serves CLIPS_PER_DAY swings per day, in order from LAUNCH_DATE.
   To add a swing: drop a short mp4 in guess/clips/ and add an object below.

   Fields:
     video    : path to the clip, e.g. "clips/karl-2026-06-10.mp4"  ("" = placeholder box)
     handicap : the player's REAL handicap as a whole number (the answer). Range -10..54
                (negative = better than scratch; plus-handicap players)
     hint     : one short clue shown under the clip (optional)
     player   : label revealed at the end, e.g. "Karl, range session" (optional)
     credit   : "@handle / submitted by" — shown small on reveal (optional, get consent!)
*/
const LAUNCH_DATE   = "2026-06-03";   // day #1 of the game (UTC)
const CLIPS_PER_DAY = 1;              // swings shown each day
const HC_MIN = -10, HC_MAX = 54;     // guess range (-10 scratch+ … 54 beginner)

const PUZZLES = [
  { id: "2sgolf-01", video: "clips/2sgolf-2026-06-10.mp4", handicap: 10, hint: "", player: "Sent by @2sgolf", credit: "" },
];
