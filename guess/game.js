/* OnPlane — Guess the Handicap: shared game logic (design-agnostic).
   Requires puzzles.js loaded first (PUZZLES, LAUNCH_DATE, CLIPS_PER_DAY, HC_MIN, HC_MAX).
   Mechanic: CLIPS_PER_DAY swings per day, ONE guess each, scored 0–5 stars by closeness.
   Expected element IDs: meta, progress, clip, hint, play, guess, go,
     clipresult, reveal, stars, stars-label, who, next,
     result, dayreveal, daygrid, st-played, st-streak, st-max, st-avg, share, copied, nexttime. */
(function(){
  const KEY = "onplane-guess-v2";              // schema bumped (multi-clip)
  const DAY = 86400000;
  const CLIPS = (typeof CLIPS_PER_DAY !== "undefined") ? CLIPS_PER_DAY : 3;
  const MAXTOTAL = CLIPS * 5;
  const launch = Date.parse(LAUNCH_DATE + "T00:00:00Z");
  const todayUTC = (function(){ const n=new Date(); return Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()); })();
  const dayNum = Math.max(0, Math.floor((todayUTC - launch)/DAY));
  const num = dayNum + 1;
  const $ = id => document.getElementById(id);

  // the CLIPS swings for today, rotating through the deck
  const start = (dayNum * CLIPS) % PUZZLES.length;
  const today = [];
  for (let i=0;i<CLIPS;i++) today.push(PUZZLES[(start+i) % PUZZLES.length]);

  if ($("meta")) $("meta").textContent = "Daily #" + num;

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  let state = load();
  if (!state.stats) state.stats = {played:0, streak:0, max:0, totalStars:0, lastDay:null};

  // resume today's progress if any
  let results = (state.day === dayNum && Array.isArray(state.results)) ? state.results.slice() : [];
  let idx = results.length;   // index of the clip currently in play

  const LABELS = ["Way off","Cold read","Getting there","Solid read","Sharp eye","Bang on — pro eyes"];

  function starsFor(off){
    if (off === 0)  return 5;   // exact
    if (off <= 2)   return 4;   // 1–2 off
    if (off <= 5)   return 3;   // 3–5 off
    if (off <= 9)   return 2;   // 6–9 off
    if (off <= 13)  return 1;   // 10–13 off
    return 0;                    // 14+ off
  }
  function starHTML(s){ return "★".repeat(s) + '<span class="off">' + "★".repeat(5-s) + "</span>"; }
  function starTxt(s){ return "⭐".repeat(s) + "☆".repeat(5-s); }
  function progressHTML(){
    let s = "Clip " + Math.min(idx+1,CLIPS) + " of " + CLIPS + " &nbsp;";
    for (let i=0;i<CLIPS;i++){
      const cls = i < results.length ? "done" : (i === idx ? "cur" : "");
      s += '<span class="dot '+cls+'"></span>';
    }
    return s;
  }

  function renderClip(){
    const p = today[idx];
    if (p && p.video) $("clip").innerHTML = '<video src="'+p.video+'" autoplay muted loop playsinline controls></video>';
    else $("clip").innerHTML = '<div class="ph"><div class="play">▶</div><div>Swing clip goes here</div><small>(placeholder)</small></div>';
    if ($("hint")){
      if (p && p.hint){ $("hint").textContent = "Hint: " + p.hint; $("hint").style.display = "block"; }
      else $("hint").style.display = "none";
    }
    if ($("progress")) $("progress").innerHTML = progressHTML();
    $("clipresult").style.display = "none";
    $("play").style.display = "";
    $("guess").value = "";
    $("guess").focus();
  }

  function showClipResult(p, g, stars){
    $("play").style.display = "none";
    $("reveal").innerHTML = 'Handicap: <span class="num">'+p.handicap+'</span> &nbsp;·&nbsp; you said '+g;
    if ($("stars")) $("stars").innerHTML = starHTML(stars);
    if ($("stars-label")) $("stars-label").textContent = LABELS[stars] || LABELS[0];
    if ($("who")) $("who").textContent = p.player ? (p.player + (p.credit ? " · "+p.credit : "")) : "";
    if ($("next")) $("next").textContent = (idx+1 < CLIPS) ? "Next clip →" : "See your result →";
    $("clipresult").style.display = "block";
    if ($("progress")) $("progress").innerHTML = progressHTML();
  }

  function doGuess(){
    const v = parseInt($("guess").value, 10);
    if (isNaN(v) || v < HC_MIN || v > HC_MAX){ $("guess").focus(); return; }
    const p = today[idx];
    const stars = starsFor(Math.abs(v - p.handicap));
    results.push({guess:v, stars:stars});
    showClipResult(p, v, stars);
  }

  function nextClip(){
    idx = results.length;
    if (idx >= CLIPS){ finishDay(); return; }
    renderClip();
  }

  function finishDay(){
    const total = results.reduce((a,r)=>a+r.stars, 0);
    if (state.day !== dayNum){                  // record stats once per day
      const st = state.stats;
      st.played++;
      st.streak = (st.lastDay === dayNum-1) ? st.streak+1 : 1;
      st.lastDay = dayNum;
      st.max = Math.max(st.max||0, total);
      st.totalStars = (st.totalStars||0) + total;
      state.day = dayNum; state.results = results;
      save(state);
    }
    ["clip","hint","play","clipresult","progress"].forEach(id => { if ($(id)) $(id).style.display = "none"; });
    if ($("dayreveal")) $("dayreveal").innerHTML = 'You scored <span class="num">'+total+'</span> / '+MAXTOTAL+' today';
    if ($("daygrid")) $("daygrid").innerHTML = results.map((r,i)=>
      '<div class="dayrow"><span class="dl">Clip '+(i+1)+'</span><span class="ds">'+starHTML(r.stars)+'</span></div>').join("");
    const st = state.stats;
    if ($("st-played")) $("st-played").textContent = st.played;
    if ($("st-streak")) $("st-streak").textContent = st.streak;
    if ($("st-max"))    $("st-max").textContent = (st.max||0) + "/" + MAXTOTAL;
    if ($("st-avg"))    $("st-avg").textContent = st.played ? (st.totalStars/st.played).toFixed(1) : "0";
    if ($("nexttime")){
      const ms = (launch + (dayNum+1)*DAY) - Date.now();
      const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
      $("nexttime").textContent = "Next " + CLIPS + " swings in " + h + "h " + m + "m";
    }
    $("result").style.display = "block";
  }

  $("go").addEventListener("click", doGuess);
  $("guess").addEventListener("keydown", e => { if (e.key === "Enter") doGuess(); });
  if ($("next")) $("next").addEventListener("click", nextClip);

  if ($("share")) $("share").addEventListener("click", function(){
    const total = results.reduce((a,r)=>a+r.stars, 0);
    const lines = results.map((r,i)=> "Clip "+(i+1)+" "+starTxt(r.stars)).join("\n");
    const out = "OnPlane ⛳ Guess the Handicap #" + num + "\n" + lines
      + "\nTotal " + total + "/" + MAXTOTAL + "\nonplaneswing.com/guess";
    if (navigator.share){ navigator.share({text: out}).catch(()=>{}); }
    else { navigator.clipboard.writeText(out).then(
        ()=>{ $("copied").textContent = "Copied! Paste it anywhere 📋"; },
        ()=>{ $("copied").textContent = out; }); }
  });

  // boot
  if (results.length >= CLIPS) finishDay();
  else renderClip();
})();
