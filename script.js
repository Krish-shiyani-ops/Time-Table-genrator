/* Smart College Timetable Generator - Greedy + Backtracking (A1 & A2 generated together) */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODsssS = [["Period 1","09:00–09:50"],["Period 2","09:50–10:40"],["Period 3","10:40–11:30"],
                 ["Period 4","12:00–12:50"],["Period 5","12:50–13:40"],["Period 6","13:40–14:30"]];
const SUBJECTS = [
  { code: "DAA", teacher: "DR. Shruti Yagnik",    lec: 3, lab: 1 },
  { code: "WT",  teacher: "Mrs. Poonam Patel",    lec: 3, lab: 1 },
  { code: "CG",  teacher: "Mr. Sanjay Prajapati", lec: 3, lab: 1 },
  { code: "PSC", teacher: "Mrs. Sheetal Panchal", lec: 3, lab: 1 },
  { code: "CN",  teacher: "Mrs. Dhwani Goradiya", lec: 3, lab: 1 },
  { code: "BST", teacher: "Mr. Prashant Chauhan", lec: 2, lab: 2 }
];
const LEC_ROOMS = ["LH-4-5", "LH-4-6", "B-425"];
const LAB_ROOMS = ["LAB-4", "LAB-5"];
const BATCHES = ["A1", "A2"];
const NSLOTS = DAYS.length * PERIODS.length; // 30
const teacherOf = {}; SUBJECTS.forEach(s => teacherOf[s.code] = s.teacher);
const roomsFor = type => (type === "Lab" ? LAB_ROOMS : LEC_ROOMS);

/* ---------- helpers ---------- */
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// All sessions both batches need (24 each). Labs first (fewest room options), then heavier subjects.
function buildSessions() {
  const list = [];
  for (const b of BATCHES) for (const s of SUBJECTS) {
    for (let i = 0; i < s.lec; i++) list.push({ batch: b, subject: s.code, type: "Lecture" });
    for (let i = 0; i < s.lab; i++) list.push({ batch: b, subject: s.code, type: "Lab" });
  }
  const load = c => { const s = SUBJECTS.find(x => x.code === c); return s.lec + s.lab; };
  return list.sort((x, y) => (x.type === "Lab" ? 0 : 1) - (y.type === "Lab" ? 0 : 1) || load(y.subject) - load(x.subject) ||
    x.subject.localeCompare(y.subject) || x.batch.localeCompare(y.batch));
}

/* ---------- shared constraint state ---------- */
function newState() { return { batch: new Set(), teacher: new Set(), room: new Set(), subjSlot: new Set(), subjDay: new Set(), dayLoad: { A1: [0,0,0,0,0], A2: [0,0,0,0,0] }, roomUse: {} }; }
const other = b => (b === "A1" ? "A2" : "A1");
function canPlace(st, s, slot, room, strict) {
  const day = Math.floor(slot / 6);
  if (st.batch.has(s.batch + "|" + slot)) return false;                        // batch free?
  if (st.teacher.has(teacherOf[s.subject] + "|" + slot)) return false;         // teacher free in BOTH batches?
  if (st.room.has(room + "|" + slot)) return false;                            // room free in BOTH batches?
  if (st.subjSlot.has(other(s.batch) + "|" + s.subject + "|" + slot)) return false; // other batch not on same subject
  if (strict && st.subjDay.has(s.batch + "|" + s.subject + "|" + day)) return false; // once per day
  return true;
}
function place(st, s, slot, room) {
  const day = Math.floor(slot / 6);
  st.batch.add(s.batch + "|" + slot); st.teacher.add(teacherOf[s.subject] + "|" + slot); st.room.add(room + "|" + slot);
  st.subjSlot.add(s.batch + "|" + s.subject + "|" + slot); st.subjDay.add(s.batch + "|" + s.subject + "|" + day);
  st.dayLoad[s.batch][day]++; st.roomUse[room] = (st.roomUse[room] || 0) + 1;
}
function unplace(st, s, slot, room) {
  const day = Math.floor(slot / 6);
  st.batch.delete(s.batch + "|" + slot); st.teacher.delete(teacherOf[s.subject] + "|" + slot); st.room.delete(room + "|" + slot);
  st.subjSlot.delete(s.batch + "|" + s.subject + "|" + slot); st.subjDay.delete(s.batch + "|" + s.subject + "|" + day);
  st.dayLoad[s.batch][day]--; st.roomUse[room]--;
}
const toEntry = (s, slot, room) => ({ batch: s.batch, subject: s.subject, type: s.type, day: Math.floor(slot / 6), period: slot % 6, room });

/* ---------- GREEDY ---------- */
function greedyPass(strict) {
  const st = newState(), entries = [], failed = [];
  for (const s of buildSessions()) {
    let best = null, bestScore = Infinity;
    for (let slot = 0; slot < NSLOTS; slot++) for (const room of roomsFor(s.type)) {
      if (!canPlace(st, s, slot, room, strict)) continue;
      // greedy choice: least-loaded day for this batch, then least-used room, small random tie-break
      const score = st.dayLoad[s.batch][Math.floor(slot / 6)] * 10 + (st.roomUse[room] || 0) + Math.random();
      if (score < bestScore) { bestScore = score; best = [slot, room]; }
    }
    if (best) { place(st, s, best[0], best[1]); entries.push(toEntry(s, best[0], best[1])); }
    else failed.push(s);
  }
  return { entries, failed };
}

/* ---------- BACKTRACKING ---------- */
function backtrackPass(strict, nodeLimit) {
  const st = newState(), sess = buildSessions(), out = new Array(sess.length);
  let nodes = 0, aborted = false;
  const same = (a, b) => a.batch === b.batch && a.subject === b.subject && a.type === b.type;
  function rec(i) {
    if (i === sess.length) return true;
    if (++nodes > nodeLimit) { aborted = true; return false; }
    const s = sess[i];
    const minSlot = i > 0 && same(sess[i - 1], s) ? out[i - 1].slot + 1 : 0; // identical sessions: increasing slots (prunes symmetry)
    for (const slot of shuffle(Array.from({ length: NSLOTS - minSlot }, (_, k) => k + minSlot)))
      for (const room of roomsFor(s.type)) {
        if (!canPlace(st, s, slot, room, strict)) continue;
        place(st, s, slot, room); out[i] = { slot, room };
        if (rec(i + 1)) return true;
        unplace(st, s, slot, room);                       // BACKTRACK
        if (aborted) return false;
      }
    return false;
  }
  const ok = rec(0);
  return { ok, aborted, nodes, entries: ok ? sess.map((s, i) => toEntry(s, out[i].slot, out[i].room)) : [] };
}

/* ---------- VALIDATOR (independent of the algorithms) ---------- */
function validate(entries) {
  const r = { teacher: [], room: [], simul: [], batch: [], count: [], roomType: [], other: [], warnings: [] };
  const group = (keyFn) => { const m = {}; entries.forEach(e => (m[keyFn(e)] = m[keyFn(e)] || []).push(e)); return m; };
  const when = e => `${DAYS[e.day]} ${PERIODS[e.period][0]}`;
  entries.forEach(e => {
    if (!(e.day >= 0 && e.day < 5 && e.period >= 0 && e.period < 6)) r.other.push(`Class outside allowed days/periods: ${e.batch} ${e.subject}`);
    if (!teacherOf[e.subject]) r.other.push(`Unknown subject ${e.subject}`);
    if (!roomsFor(e.type).includes(e.room)) r.roomType.push(`${e.type} of ${e.subject} (${e.batch}) uses invalid room ${e.room} on ${when(e)}`);
  });
  const byTeacher = group(e => teacherOf[e.subject] + "|" + e.day + "|" + e.period);
  for (const k in byTeacher) if (byTeacher[k].length > 1) r.teacher.push(`${teacherOf[byTeacher[k][0].subject]} double-booked on ${when(byTeacher[k][0])} (${byTeacher[k].map(e => e.batch).join(" & ")})`);
  const byRoom = group(e => e.room + "|" + e.day + "|" + e.period);
  for (const k in byRoom) if (byRoom[k].length > 1) r.room.push(`Room ${byRoom[k][0].room} double-booked on ${when(byRoom[k][0])}`);
  const byBatch = group(e => e.batch + "|" + e.day + "|" + e.period);
  for (const k in byBatch) if (byBatch[k].length > 1) r.batch.push(`Batch ${byBatch[k][0].batch} has ${byBatch[k].length} sessions on ${when(byBatch[k][0])}`);
  const bySlot = group(e => e.day + "|" + e.period);
  for (const k in bySlot) { const a = bySlot[k].filter(e => e.batch === "A1"), b = bySlot[k].filter(e => e.batch === "A2");
    a.forEach(x => b.forEach(y => { if (x.subject === y.subject) r.simul.push(`Both batches have ${x.subject} on ${when(x)}`); })); }
  for (const b of BATCHES) {
    const mine = entries.filter(e => e.batch === b);
    if (mine.length !== 24) r.count.push(`Batch ${b} has ${mine.length} sessions (required 24)`);
    for (const s of SUBJECTS) for (const [t, need] of [["Lecture", s.lec], ["Lab", s.lab]]) {
      const n = mine.filter(e => e.subject === s.code && e.type === t).length;
      if (n !== need) r.count.push(`Batch ${b}: ${s.code} ${t} count is ${n} (required ${need})`);
    }
    const perDay = {}; mine.forEach(e => { const k = e.subject + "|" + e.day; perDay[k] = (perDay[k] || 0) + 1; });
    for (const k in perDay) if (perDay[k] > 1) r.warnings.push(`Batch ${b}: ${k.split("|")[0]} appears ${perDay[k]} times on ${DAYS[k.split("|")[1]]} (soft rule)`);
  }
  r.valid = ["teacher", "room", "simul", "batch", "count", "roomType", "other"].every(k => r[k].length === 0);
  return r;
}

/* ---------- Solve (runs the chosen algorithm, never fakes success) ---------- */
function solve(algo) {
  const t0 = performance.now(); const notes = []; let entries = [], fail = "";
  for (const strict of [true, false]) {
    if (algo === "greedy") {
      const g = greedyPass(strict);
      if (g.failed.length === 0) { entries = g.entries; fail = ""; if (!strict) notes.push("Relaxed the soft 'subject once per day' rule to finish."); break; }
      entries = g.entries; fail = `Greedy could not place ${g.failed.length} session(s): ` + g.failed.map(s => `${s.batch} ${s.subject} ${s.type}`).join(", ");
    } else {
      const b = backtrackPass(strict, 300000);
      if (b.ok) { entries = b.entries; fail = ""; if (!strict) notes.push("Relaxed the soft 'subject once per day' rule to finish."); break; }
      entries = []; fail = b.aborted ? "Backtracking stopped after 300000 nodes without finding a full schedule." : "Backtracking proved no schedule exists under the constraints.";
    }
  }
  const report = validate(entries);
  return { algo, entries, report, notes, failure: fail, ms: performance.now() - t0 };
}
function avgTime(algo, runs) { let t = 0, ok = 0; for (let i = 0; i < runs; i++) { const r = solve(algo); t += r.ms; if (r.report.valid) ok++; } return { ms: t / runs, ok, runs }; }

/* ---------- UI ---------- */
let current = null;
function $(id) { return document.getElementById(id); }
function renderTimetable() {
  const b = $("batchSelect").value; const grid = {};
  current.entries.filter(e => e.batch === b).forEach(e => grid[e.day + "|" + e.period] = e);
  let h = `<table class="tt"><thead><tr><th>Period / Time</th>${DAYS.map(d => `<th>${d}</th>`).join("")}</tr></thead><tbody>`;
  const row = p => { h += `<tr><th class="pt">${PERIODS[p][0]}<small>${PERIODS[p][1]}</small></th>`;
    for (let d = 0; d < 5; d++) { const e = grid[d + "|" + p];
      h += e ? `<td class="${e.type === "Lab" ? "lab" : "lec"}"><b>${e.subject}</b><span class="tag">${e.type}</span><div>${teacherOf[e.subject]}</div><div class="room">${e.room}</div></td>` : `<td class="free">Free</td>`; }
    h += "</tr>"; };
  [0, 1, 2].forEach(row); h += `<tr class="lunch"><th>Lunch Break<small>11:30–12:00</small></th><td colspan="5">LUNCH BREAK</td></tr>`; [3, 4, 5].forEach(row);
  $("grid").innerHTML = h + "</tbody></table>"; $("gridTitle").textContent = `Weekly Timetable – Batch ${b}`;
}
function renderReport() {
  const r = current.report, n = k => r[k].length, cnt = current.entries.length;
  $("cards").innerHTML = [["Algorithm", current.algo === "greedy" ? "Greedy" : "Backtracking"], ["Sessions Scheduled", cnt + " / 48"],
    ["Teacher Conflicts", n("teacher")], ["Room Conflicts", n("room")], ["Same-Subject Conflicts", n("simul")], ["All Requirements", r.valid ? "Satisfied" : "NOT satisfied"]]
    .map(([a, v]) => `<div class="card"><small>${a}</small><strong>${v}</strong></div>`).join("");
  let h = "";
  if (r.valid) h += `<div class="ok">Timetable generated successfully. All teacher, room, batch, and weekly requirement checks passed.</div>`;
  else h += `<div class="bad">Timetable is INVALID.${current.failure ? " " + current.failure : ""}</div>`;
  const sec = (t, k) => r[k].length ? `<h4>${t} (${r[k].length})</h4><ul>${r[k].map(x => `<li>${x}</li>`).join("")}</ul>` : "";
  h += sec("Teacher clashes", "teacher") + sec("Room clashes", "room") + sec("Same-subject clashes A1/A2", "simul") + sec("Batch slot clashes", "batch") +
       sec("Missing / wrong session counts", "count") + sec("Invalid room types", "roomType") + sec("Other violations", "other");
  if (r.warnings.length) h += `<div class="warn"><b>Soft-rule notes:</b><ul>${r.warnings.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
  current.notes.forEach(x => h += `<div class="warn">${x}</div>`);
  h += `<h4>Checks performed</h4><ul class="checks"><li>Teacher never in two places at once (A1 + A2 together)</li><li>Room never used twice in one slot</li><li>A1 and A2 never have the same subject together</li><li>Every batch has 3/3/3/3/3/2 lectures and 1/1/1/1/1/2 labs (24 sessions)</li><li>Labs use LAB-4/LAB-5 (one slot each), lectures use LH-4-5/LH-4-6/B-425</li><li>Only Mon–Fri, 6 periods, nothing in lunch</li></ul>`;
  $("report").innerHTML = h;
}
function generate() {
  current = solve($("algoSelect").value);
  const g = avgTime("greedy", 10), b = avgTime("backtracking", 10);
  $("compare").innerHTML = `<tr><td>Greedy</td><td>${g.ms.toFixed(2)} ms</td><td>${g.ok}/${g.runs} valid</td></tr><tr><td>Backtracking</td><td>${b.ms.toFixed(2)} ms</td><td>${b.ok}/${b.runs} valid</td></tr>`;
  renderTimetable(); renderReport();
}
function downloadCSV() {
  const b = $("batchSelect").value; const rows = [["Day", "Period", "Time", "Subject", "Type", "Teacher", "Room"]];
  current.entries.filter(e => e.batch === b).sort((x, y) => x.day - y.day || x.period - y.period)
    .forEach(e => rows.push([DAYS[e.day], PERIODS[e.period][0], PERIODS[e.period][1], e.subject, e.type, teacherOf[e.subject], e.room]));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" }));
  a.download = `timetable_${b}.csv`; a.click();
}
if (typeof document !== "undefined") {
  $("refTable").innerHTML = SUBJECTS.map(s => `<tr><td>${s.code}</td><td>${s.teacher}</td><td>${s.lec}</td><td>${s.lab}</td><td>${s.lec + s.lab}</td></tr>`).join("");
  $("generateBtn").onclick = generate; $("printBtn").onclick = () => window.print(); $("csvBtn").onclick = downloadCSV;
  $("batchSelect").onchange = renderTimetable; generate();
} else if (typeof module !== "undefined") module.exports = { solve, validate };
