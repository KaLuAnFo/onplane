/* OnPlane — Guess the Handicap puzzle schedule.
   One entry = one daily puzzle, played in order from LAUNCH_DATE.
   To add a puzzle: drop a short mp4 in guess/clips/ and add an object below.

   Fields:
     video    : path to the clip, e.g. "clips/karl-2026-06-10.mp4"  ("" = placeholder box)
     handicap : the player's REAL handicap, rounded to a whole number (the answer)
     hint     : one short clue shown after the first wrong guess (optional)
     player   : label revealed at the end, e.g. "Karl, range session" (optional)
     credit   : "@handle / submitted by" — shown small on reveal (optional, get consent!)
*/
const LAUNCH_DATE = "2026-06-03";           // day #1 of the game (UTC)
const MAX_GUESSES = 5;
const HC_MIN = 0, HC_MAX = 36;              // guess range (amateur handicaps)

const PUZZLES = [
  { video: "", handicap: 14, hint: "Decent tempo, slightly over the top.", player: "Sample swing", credit: "" },
  { video: "", handicap: 6,  hint: "Compact and connected.",               player: "Sample swing", credit: "" },
  { video: "", handicap: 24, hint: "Big slide, early extension.",          player: "Sample swing", credit: "" },
];
