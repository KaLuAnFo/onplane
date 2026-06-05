/* OnPlane — Guess the Handicap: shared game logic (design-agnostic).
   Requires puzzles.js loaded first (PUZZLES, LAUNCH_DATE, MAX_GUESSES, HC_MIN, HC_MAX).
   Expects these element IDs in the page: meta, clip, hint, play, guess, go, left,
   rows, result, reveal, who, st-played, st-win, st-streak, st-max, share, copied, next.
   Builds guess rows as: <div class="grow [hit|close]"><span class="g"><span class="fb"><span class="em"></div> */
(function(){
  const KEY = "onplane-guess-v1";
  const DAY = 86400000;
  const launch = Date.parse(LAUNCH_DATE + "T00:00:00Z");
  const todayUTC = (function(){ const n=new Date(); return Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()); })();
  const dayNum = Math.max(0, Math.floor((todayUTC - launch)/DAY));
  const puzzle = PUZZLES[dayNum % PUZZLES.length];
  const num = dayNum + 1;
  const $ = id => document.getElementById(id);

  if ($("meta")) $("meta").textContent = "Daily #" + num;
  if ($("left")) $("left").textContent = MAX_GUESSES;

  (function renderClip(){
    if (!$("clip")) return;
    if (puzzle.video) $("clip").innerHTML = '<video src="'+puzzle.video+'" autoplay muted loop playsinline controls></video>';
    else $("clip").innerHTML = '<div class="ph"><div class="play">▶</div><div>Swing clip goes here</div><small>(placeholder)</small></div>';
  })();

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  let state = load();
  if (!state.stats) state.stats = {played:0, wins:0, streak:0, max:0, lastWonDay:null};

  let guesses = [];
  let finished = false;

  function emojiFor(g){
    const d = Math.abs(g - puzzle.handicap);
    if (d === 0) return "🟩";
    if (d <= 3) return "🟨";
    return "⬜";
  }
  function starsFor(off){
    if (off === 0)  return 5;   // exact
    if (off <= 2)   return 4;   // 1–2 off
    if (off <= 5)   return 3;   // 3–5 off
    if (off <= 9)   return 2;   // 6–9 off
    if (off <= 13)  return 1;   // 10–13 off
    return 0;                    // 14+ off
  }
  function bestOff(){ return guesses.reduce((m,g)=>Math.min(m, Math.abs(g-puzzle.handicap)), Infinity); }
  function feedback(g){
    if (g === puzzle.handicap) return {cls:"hit", txt:"Correct!", em:"🟩"};
    const close = Math.abs(g-puzzle.handicap) <= 3;
    return { cls: close?"close":"", em: emojiFor(g),
      txt: (g < puzzle.handicap ? "Too low — aim higher ↑" : "Too high — aim lower ↓") + (close?" (close!)":"") };
  }
  function renderRow(g){
    const f = feedback(g);
    const row = document.createElement("div");
    row.className = "grow " + f.cls;
    row.innerHTML = '<span class="g">'+g+'</span><span class="fb">'+f.txt+'</span><span class="em">'+f.em+'</span>';
    $("rows").appendChild(row);
  }

  function finish(won){
    finished = true;
    if ($("play")) $("play").style.display = "none";
    if (state.today !== dayNum){
      const st = state.stats;
      st.played++;
      if (won){ st.wins++; st.streak = (st.lastWonDay === dayNum-1) ? st.streak+1 : 1; st.lastWonDay = dayNum; st.max = Math.max(st.max, st.streak); }
      else { st.streak = 0; }
      state.today = dayNum; state.todayGuesses = guesses; state.todayWon = won;
      save(state);
    }
    $("reveal").innerHTML = won
      ? 'Nice — handicap was <span class="num">'+puzzle.handicap+'</span>'
      : 'Handicap was <span class="num">'+puzzle.handicap+'</span>';
    if ($("stars")){
      const s = starsFor(bestOff());
      $("stars").innerHTML = "★".repeat(s) + '<span class="off">' + "★".repeat(5-s) + "</span>";
      $("stars").setAttribute("aria-label", s + " out of 5 stars");
      if ($("stars-label")){
        const labels = ["Way off — watch a few more","Getting an eye for it","Solid read","Sharp eye","Bang on — pro eyes"];
        $("stars-label").textContent = labels[s] || labels[0];
      }
    }
    if (puzzle.player && $("who")) $("who").textContent = puzzle.player + (puzzle.credit? " · "+puzzle.credit : "");
    const st = state.stats;
    if ($("st-played")) $("st-played").textContent = st.played;
    if ($("st-win"))    $("st-win").textContent = (st.played? Math.round(100*st.wins/st.played):0) + "%";
    if ($("st-streak")) $("st-streak").textContent = st.streak;
    if ($("st-max"))    $("st-max").textContent = st.max;
    if ($("next")){
      const ms = (launch + (dayNum+1)*DAY) - Date.now();
      const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
      $("next").textContent = "Next swing in " + h + "h " + m + "m";
    }
    $("result").style.display = "block";
  }

  function doGuess(){
    if (finished) return;
    const v = parseInt($("guess").value, 10);
    if (isNaN(v) || v < HC_MIN || v > HC_MAX){ $("guess").focus(); return; }
    guesses.push(v);
    renderRow(v);
    $("guess").value = "";
    const left = MAX_GUESSES - guesses.length;
    if ($("left")) $("left").textContent = left;
    if (v === puzzle.handicap){ finish(true); return; }
    if (puzzle.hint && $("hint") && !$("hint").textContent){      // reveal hint after first miss
      $("hint").textContent = "Hint: " + puzzle.hint; $("hint").classList.add("show");
    }
    if (left <= 0){ finish(false); return; }
    $("guess").focus();
  }

  if (state.today === dayNum && Array.isArray(state.todayGuesses)){
    guesses = state.todayGuesses.slice();
    guesses.forEach(renderRow);
    finish(state.todayWon);
  }

  $("go").addEventListener("click", doGuess);
  $("guess").addEventListener("keydown", e => { if (e.key === "Enter") doGuess(); });

  $("share").addEventListener("click", function(){
    const grid = guesses.map(emojiFor).join("");
    const won = state.todayWon ?? (guesses[guesses.length-1] === puzzle.handicap);
    const s = starsFor(bestOff());
    const stars = "⭐".repeat(s) + "☆".repeat(5-s);
    const line = "OnPlane ⛳ Guess the Handicap #" + num + "\n"
      + stars + "\n"
      + grid + "  " + (won ? guesses.length : "X") + "/" + MAX_GUESSES + "\n"
      + "onplaneswing.com/guess";
    if (navigator.share){ navigator.share({text: line}).catch(()=>{}); }
    else { navigator.clipboard.writeText(line).then(
        ()=>{ $("copied").textContent = "Copied! Paste it anywhere 📋"; },
        ()=>{ $("copied").textContent = line; }); }
  });
})();
