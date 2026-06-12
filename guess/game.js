/* OnPlane — Guess the Handicap: shared game logic (design-agnostic).
   Requires puzzles.js loaded first (PUZZLES, LAUNCH_DATE, CLIPS_PER_DAY, HC_MIN, HC_MAX).
   Mechanic: CLIPS_PER_DAY swings per day, ONE guess each, scored 0–5 stars by closeness.
   Expected element IDs: meta, progress, clip, play, guess, go,
     clipmodal, closeclip, reveal, stars, stars-label, closeness, who, next,
     clipresult (inline fallback), reveal2, next2,
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
  if (CLIPS === 1 && $("progress")) $("progress").style.display = "none";  // no per-clip progress for a single daily swing

  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  let state = load();
  if (!state.stats) state.stats = {played:0, streak:0, max:0, totalStars:0, lastDay:null};

  // resume today's progress if any
  let results = (state.day === dayNum && Array.isArray(state.results)) ? state.results.slice() : [];
  let idx = results.length;   // index of the clip currently in play

  const LABELS = ["Way off","Cold read","Getting there","Solid read","Sharp eye","Bang on — pro eyes"];

  // Golf convention: better-than-scratch is a "plus" handicap, written +6 (stored as -6 internally).
  // 0 is scratch; worse handicaps are plain positive numbers.
  function fmtHC(n){ return n < 0 ? "+" + (-n) : (n === 0 ? "scratch" : "" + n); }
  // Accept "+6" (plus handicap → internal -6), plain "6", and lenient "-6" (also a plus).
  function parseGuess(raw){
    raw = String(raw).trim();
    if (!raw) return NaN;
    if (raw[0] === "+") return -parseInt(raw.slice(1), 10);
    return parseInt(raw, 10);
  }

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
    if ($("progress")) $("progress").innerHTML = progressHTML();
    $("clipresult").style.display = "none";
    if ($("clipmodal")) $("clipmodal").classList.remove("show");
    $("play").style.display = "";
    $("guess").value = "";
    $("guess").focus();
  }

  function showClipResult(p, g, stars){
    $("play").style.display = "none";
    const revealHTML = 'Handicap: <span class="num">'+fmtHC(p.handicap)+'</span> &nbsp;·&nbsp; you said '+fmtHC(g);
    const nextTxt = (idx+1 < CLIPS) ? "Next clip →" : "See your result →";
    $("reveal").innerHTML = revealHTML;
    if ($("reveal2")) $("reveal2").innerHTML = revealHTML;
    if ($("stars")) $("stars").innerHTML = starHTML(stars);
    if ($("stars-label")) $("stars-label").textContent = LABELS[stars] || LABELS[0];
    const off = Math.abs(g - p.handicap);
    if ($("closeness")){
      $("closeness").className = "closeness" + (off === 0 ? " perfect" : "");
      $("closeness").innerHTML = off === 0
        ? "Spot on — you nailed it."
        : 'Off by <span class="em">' + off + '</span> ' + (off === 1 ? "stroke" : "strokes");
    }
    if ($("who")) $("who").textContent = p.player ? (p.player + (p.credit ? " · "+p.credit : "")) : "";
    if ($("next")) $("next").textContent = nextTxt;
    if ($("next2")) $("next2").textContent = nextTxt;
    $("clipresult").style.display = "none";       // fallback hidden until popup dismissed
    if ($("clipmodal")) $("clipmodal").classList.add("show");
    if ($("progress")) $("progress").innerHTML = progressHTML();
  }

  function dismissModal(){
    if ($("clipmodal")) $("clipmodal").classList.remove("show");
    $("clipresult").style.display = "block";       // reveal inline strip so you can still continue
  }

  function doGuess(){
    const v = parseGuess($("guess").value);
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
    if ($("clipmodal")) $("clipmodal").classList.remove("show");
    ["clip","play","clipresult","progress"].forEach(id => { if ($(id)) $(id).style.display = "none"; });
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
      $("nexttime").textContent = "Next " + (CLIPS === 1 ? "swing" : CLIPS + " swings") + " in " + h + "h " + m + "m";
    }
    $("result").style.display = "block";
  }

  $("go").addEventListener("click", doGuess);
  $("guess").addEventListener("keydown", e => { if (e.key === "Enter") doGuess(); });
  if ($("next")) $("next").addEventListener("click", nextClip);
  if ($("next2")) $("next2").addEventListener("click", nextClip);
  if ($("closeclip")) $("closeclip").addEventListener("click", dismissModal);
  if ($("clipmodal")) $("clipmodal").addEventListener("click", e => { if (e.target === $("clipmodal")) dismissModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("clipmodal") && $("clipmodal").classList.contains("show")) dismissModal(); });

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
