# Smart College Timetable Generator Using Greedy Algorithm and Backtracking
Indus University | Information Technology | Semester 5 | Section A | Batches A1 and A2

## How to run
1. Put `index.html`, `style.css`, `script.js` and `README.md` in one folder.
2. Double-click `index.html` (no server, Node.js or internet needed).
3. Pick a batch and algorithm, then click **Generate Timetable**.

## What it does
- Generates A1 and A2 **together** (48 sessions: 24 per batch) so clashes are checked across both batches.
- Same subjects, same teacher per subject, same weekly counts for both batches.
- Mon-Fri, 6 periods of 50 min from 09:00, lunch 11:30-12:00 (not a class slot). 30 slots per batch.
- Each lab = one slot. Lectures use LH-4-5 / LH-4-6 / B-425, labs use LAB-4 / LAB-5.
- An independent validator checks teacher, room, batch, same-subject (A1 vs A2), counts, room types and slot ranges. Success is shown only if the validator confirms it.
- Print and CSV export (for the selected batch) are included.

## Viva notes
**Greedy:** sort sessions (labs first, heavy subjects first) -> for each session pick the best valid (day, period, room) by a score (least busy day, least used room) -> never undo. Fast, but can fail; if so it says so.

**Backtracking:** place sessions one by one -> if no valid slot, undo the previous placement and try another slot/room (recursion). Slower in the worst case but explores all options. Identical sessions are forced into increasing slots to cut repeated work; a 300000-node limit prevents hanging.

**Soft rule:** a subject appears at most once per day per batch. Tried first; if impossible it is relaxed and a note is shown.

## Tested constraints
Subject counts per batch (3/3/3/3/3/2 lectures, 1/1/1/1/1/2 labs), 24 sessions each, no teacher/room/batch double-booking, A1 and A2 never share a subject in a slot, correct room types, nothing in lunch. Both algorithms were run 200 times each with zero invalid results.

## Limitations
Room capacity, teacher preferences and breaks between labs are not modelled. Each Generate click gives a different valid timetable (random tie-breaking).
